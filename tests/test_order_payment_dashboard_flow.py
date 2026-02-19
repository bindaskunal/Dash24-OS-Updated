"""
Dash24 V1 - End-to-End Integration Test
Order + Payment + Dashboard Flow
"""
import pytest
import asyncio
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone
from decimal import Decimal
import uuid

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.database import Base, get_db
from app.models.user import User, Address
from app.models.product import Product, Brand, Category
from app.models.cart import Cart, CartItem
from app.models.enums import UserRole, PaymentMethod
from app.core.security import get_password_hash
from app.server import app


TEST_DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_tk0FumpVDJw7@ep-quiet-frost-a1ar67af-pooler.ap-southeast-1.aws.neon.tech/neondb"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    echo=False
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest.fixture(scope="function")
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def override_get_db(db_session):
    async def _override_get_db():
        yield db_session
    return _override_get_db


@pytest.fixture
async def client(override_get_db):
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_brand(db_session):
    brand = Brand(
        id=uuid.uuid4(),
        name="Test Brand",
        slug="test-brand",
        is_active=True
    )
    db_session.add(brand)
    await db_session.commit()
    await db_session.refresh(brand)
    return brand


@pytest.fixture
async def test_category(db_session):
    category = Category(
        id=uuid.uuid4(),
        name="Test Category",
        slug="test-category",
        is_active=True
    )
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    return category


@pytest.fixture
async def test_product(db_session, test_brand, test_category):
    product = Product(
        id=uuid.uuid4(),
        brand_id=test_brand.id,
        category_id=test_category.id,
        sku="TEST-SKU-001",
        name="Test Product",
        description="Test product description",
        price=Decimal("99.99"),
        stock_quantity=100,
        is_active=True
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    return product


@pytest.fixture
async def test_customer_user(db_session):
    user = User(
        id=uuid.uuid4(),
        email="customer@test.com",
        phone="+919999999999",
        password_hash=get_password_hash("password123"),
        role=UserRole.CUSTOMER,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_brand_user(db_session, test_brand):
    user = User(
        id=uuid.uuid4(),
        email="brand@test.com",
        phone="+918888888888",
        password_hash=get_password_hash("password123"),
        role=UserRole.BRAND,
        brand_id=test_brand.id,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_address(db_session, test_customer_user):
    address = Address(
        id=uuid.uuid4(),
        user_id=test_customer_user.id,
        full_address="123 Test Street",
        city="Bangalore",
        state="Karnataka",
        pincode="560001",
        address_type="home",
        is_default=True
    )
    db_session.add(address)
    await db_session.commit()
    await db_session.refresh(address)
    return address


@pytest.fixture
async def test_cart_with_items(db_session, test_customer_user, test_product):
    cart = Cart(
        id=uuid.uuid4(),
        user_id=test_customer_user.id,
        is_active=True
    )
    db_session.add(cart)
    await db_session.flush()
    
    cart_item = CartItem(
        id=uuid.uuid4(),
        cart_id=cart.id,
        product_id=test_product.id,
        quantity=2,
        unit_price=test_product.price
    )
    db_session.add(cart_item)
    await db_session.commit()
    await db_session.refresh(cart)
    return cart


@pytest.fixture
def mock_razorpay():
    with patch('app.services.payment_service.razorpay.Client') as mock_client:
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        
        mock_instance.order.create.return_value = {
            "id": "order_test123",
            "amount": 20000,
            "currency": "INR",
            "status": "created"
        }
        
        mock_instance.utility.verify_payment_signature.return_value = True
        
        yield mock_instance


@pytest.fixture
def mock_easyecom():
    with patch('app.services.fulfillment_service.httpx.AsyncClient') as mock_client:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "order_id": "EC123456",
            "status": "received"
        }
        
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
        mock_client.return_value = mock_context
        
        yield mock_client


@pytest.mark.asyncio
async def test_full_order_payment_dashboard_flow(
    client,
    db_session,
    test_customer_user,
    test_brand_user,
    test_address,
    test_cart_with_items,
    test_product,
    test_brand,
    mock_razorpay,
    mock_easyecom
):
    """
    End-to-end test: Register -> Login -> Create Order -> Verify Payment -> Check Dashboard
    """
    
    customer_token = None
    brand_token = None
    order_id = None
    razorpay_order_id = "order_test123"
    
    login_response = await client.post(
        "/api/auth/login",
        json={
            "email": "customer@test.com",
            "password": "password123"
        }
    )
    assert login_response.status_code == 200
    customer_data = login_response.json()
    assert "data" in customer_data
    customer_token = customer_data["data"]["access_token"]
    assert customer_token is not None
    
    brand_login_response = await client.post(
        "/api/auth/login",
        json={
            "email": "brand@test.com",
            "password": "password123"
        }
    )
    assert brand_login_response.status_code == 200
    brand_data = brand_login_response.json()
    brand_token = brand_data["data"]["access_token"]
    assert brand_token is not None
    
    create_order_response = await client.post(
        "/api/orders",
        json={
            "address_id": str(test_address.id),
            "payment_method": "prepaid",
            "wallet_amount": 0,
            "delivery_instructions": "Test delivery"
        },
        headers={
            "Authorization": f"Bearer {customer_token}",
            "X-Idempotency-Key": f"test-{uuid.uuid4()}"
        }
    )
    assert create_order_response.status_code == 201
    order_data = create_order_response.json()
    assert "data" in order_data
    assert "order" in order_data["data"]
    order_id = order_data["data"]["order"]["id"]
    assert order_id is not None
    
    assert "payment" in order_data["data"]
    razorpay_order_id = order_data["data"]["payment"]["razorpay_order_id"]
    assert razorpay_order_id is not None
    
    verify_payment_response = await client.post(
        "/api/payments/verify",
        json={
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": "pay_test123",
            "razorpay_signature": "test_signature"
        },
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert verify_payment_response.status_code == 200
    payment_data = verify_payment_response.json()
    assert payment_data["data"]["payment_status"] == "captured"
    assert payment_data["data"]["status"] == "confirmed"
    
    dashboard_response = await client.get(
        "/api/dashboard/brand",
        headers={"Authorization": f"Bearer {brand_token}"}
    )
    assert dashboard_response.status_code == 200
    dashboard_data = dashboard_response.json()
    assert "data" in dashboard_data
    metrics = dashboard_data["data"]
    
    assert metrics["total_orders"] >= 1
    assert metrics["total_revenue"] > 0
    assert metrics["status_breakdown"]["confirmed"] >= 1
    
    expected_revenue = float(test_product.price) * 2
    assert metrics["total_revenue"] >= expected_revenue
