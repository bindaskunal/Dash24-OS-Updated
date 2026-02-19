# Dash24 V1 - LLM Readiness Architecture

## Overview

Schema extensions and design patterns to enable future LLM/AI capabilities including semantic search, personalized recommendations, conversational commerce, and intelligent automation.

---

## LLM-Ready Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          LLM-READY ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   CURRENT (V1)                           FUTURE (V2+)                            │
│   ┌─────────────────────────────┐       ┌─────────────────────────────────────┐ │
│   │  Structured Data Layer      │       │      AI/LLM Layer                    │ │
│   │                             │       │                                      │ │
│   │  • Rich product attributes  │──────▶│  • Semantic search                   │ │
│   │  • Brand metadata           │       │  • Personalized recommendations      │ │
│   │  • User preferences         │       │  • Conversational commerce           │ │
│   │  • Embeddings placeholder   │       │  • Intelligent automation            │ │
│   │                             │       │                                      │ │
│   └─────────────────────────────┘       └─────────────────────────────────────┘ │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    DATA FOUNDATION FOR AI                                │   │
│   │                                                                          │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│   │   │  Products   │  │   Brands    │  │   Users     │  │   Events    │    │   │
│   │   │  JSONB      │  │   JSONB     │  │   JSONB     │  │   JSONB     │    │   │
│   │   │  Embeddings │  │  Metadata   │  │ Preferences │  │  Behavior   │    │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    FUTURE AI CAPABILITIES                                │   │
│   │                                                                          │   │
│   │   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │   │
│   │   │  Vector Search    │  │  RAG Retrieval    │  │  Agent Actions    │   │   │
│   │   │  (pgvector)       │  │  (Product KB)     │  │  (Order/Support)  │   │   │
│   │   └───────────────────┘  └───────────────────┘  └───────────────────┘   │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Schema Extensions

### 1. Enhanced Product Attributes

```sql
-- Extended product table for LLM readiness
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes_extended JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';

-- Structure for attributes_extended:
/*
{
    "basic": {
        "brand": "Farm Fresh",
        "category": "Fruits",
        "subcategory": "Seasonal Fruits"
    },
    
    "physical": {
        "weight": "500g",
        "weight_grams": 500,
        "dimensions": {"length": 15, "width": 10, "height": 8},
        "packaging": "eco-friendly box",
        "units_per_pack": 4
    },
    
    "sourcing": {
        "origin": "Ratnagiri, Maharashtra",
        "farm_type": "organic",
        "certifications": ["FSSAI", "India Organic"],
        "harvest_date": "2024-01-10",
        "shelf_life_days": 7
    },
    
    "dietary": {
        "vegan": true,
        "vegetarian": true,
        "gluten_free": true,
        "contains_allergens": [],
        "nutritional_per_100g": {
            "calories": 60,
            "protein_g": 0.8,
            "carbs_g": 15,
            "fat_g": 0.4,
            "fiber_g": 1.6
        }
    },
    
    "taste_profile": {
        "sweetness": 8,
        "sourness": 2,
        "texture": "creamy, fibrous",
        "aroma": "tropical, sweet",
        "best_for": ["desserts", "smoothies", "direct consumption"]
    },
    
    "storage": {
        "requires_refrigeration": true,
        "storage_temp_celsius": "4-8",
        "storage_instructions": "Keep refrigerated. Consume within 5 days of opening."
    },
    
    "sustainability": {
        "recyclable_packaging": true,
        "carbon_footprint_kg": 0.3,
        "local_sourcing": true
    },
    
    "usage": {
        "serving_suggestions": ["Slice and eat fresh", "Add to fruit salad", "Blend into smoothie"],
        "pairs_well_with": ["ice cream", "yogurt", "coconut"],
        "recipe_ideas": ["Mango lassi", "Mango sticky rice"]
    },
    
    "tags": ["premium", "seasonal", "gift-worthy", "summer-special"]
}
*/

-- Structure for ai_metadata:
/*
{
    "embedding_version": "v1",
    "embedding_model": "text-embedding-3-small",
    "last_embedded_at": "2024-01-15T10:30:00Z",
    
    "text_for_embedding": "Alphonso Mangoes 500g from Ratnagiri Maharashtra. Premium organic seasonal fruit...",
    
    "semantic_tags": [
        "tropical-fruit",
        "premium-quality", 
        "gift-option",
        "summer-fruit",
        "indian-origin"
    ],
    
    "search_keywords": [
        "hapus", "alphonso", "mango", "ratnagiri", 
        "organic", "seasonal", "gift"
    ],
    
    "similar_products": ["product-uuid-1", "product-uuid-2"],
    
    "recommendation_features": {
        "price_tier": "premium",
        "seasonality": "summer",
        "gift_score": 0.9,
        "health_score": 0.8,
        "impulse_buy_score": 0.6
    }
}
*/

-- Embedding vector column (placeholder for pgvector)
-- Will be activated when pgvector extension is installed
-- ALTER TABLE products ADD COLUMN embedding vector(1536);

-- For now, store as array for future migration
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding_vector JSONB;
-- Store as: {"values": [0.1, 0.2, ...], "model": "text-embedding-3-small", "version": 1}

-- GIN indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_products_attributes_ext 
    ON products USING gin(attributes_extended jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_products_ai_metadata 
    ON products USING gin(ai_metadata jsonb_path_ops);

-- Full-text search with enhanced weights
DROP INDEX IF EXISTS idx_product_search;
CREATE INDEX idx_product_search_enhanced ON products USING gin(
    to_tsvector('english', 
        name || ' ' || 
        COALESCE(description, '') || ' ' ||
        COALESCE(short_description, '') || ' ' ||
        COALESCE(ai_metadata->>'search_keywords', '')
    )
);
```

### 2. Enhanced Brand Metadata

```sql
-- Extended brand metadata for LLM context
ALTER TABLE brands ADD COLUMN IF NOT EXISTS metadata_extended JSONB DEFAULT '{}';

-- Structure:
/*
{
    "identity": {
        "tagline": "Fresh from the farm to your table",
        "story": "Founded in 2015, Farm Fresh partners with organic farmers across Karnataka...",
        "mission": "Making organic produce accessible to urban families",
        "values": ["sustainability", "farmer-first", "quality"]
    },
    
    "personality": {
        "tone": "friendly, trustworthy, health-conscious",
        "voice_examples": [
            "We believe in food that's good for you and good for the planet",
            "Straight from our partner farms to your kitchen"
        ]
    },
    
    "demographics": {
        "target_audience": "health-conscious urban families",
        "age_range": "25-45",
        "lifestyle": "active, wellness-focused"
    },
    
    "product_focus": {
        "categories": ["fruits", "vegetables", "dairy"],
        "specialties": ["organic produce", "seasonal fruits", "farm-fresh dairy"],
        "price_positioning": "premium",
        "quality_indicators": ["organic", "pesticide-free", "locally-sourced"]
    },
    
    "operational": {
        "fulfillment_priority": 1,
        "avg_prep_time_mins": 30,
        "packaging_notes": "Uses eco-friendly packaging",
        "special_handling": ["requires_refrigeration"]
    },
    
    "ai_instructions": {
        "recommendation_boost": 1.2,
        "upsell_products": ["category:dairy", "category:bread"],
        "cross_sell_brands": ["brand-uuid-1"],
        "seasonal_relevance": {
            "summer": 1.5,
            "monsoon": 0.8
        }
    }
}
*/

CREATE INDEX IF NOT EXISTS idx_brand_metadata 
    ON brands USING gin(metadata_extended jsonb_path_ops);
```

### 3. User Preference Model

```sql
-- User preferences for personalization
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_profile JSONB DEFAULT '{}';

-- Structure for preferences:
/*
{
    "dietary": {
        "vegetarian": true,
        "vegan": false,
        "gluten_free": false,
        "allergies": ["peanuts"],
        "dislikes": ["bitter gourd", "okra"]
    },
    
    "shopping": {
        "preferred_brands": ["brand-uuid-1", "brand-uuid-2"],
        "preferred_categories": ["fruits", "dairy"],
        "price_sensitivity": "medium",  // low, medium, high
        "organic_preference": "preferred",  // required, preferred, indifferent
        "brand_loyalty": 0.7  // 0-1 scale
    },
    
    "delivery": {
        "preferred_slot": "evening",
        "preferred_day": "saturday",
        "special_instructions": "Ring doorbell twice"
    },
    
    "communication": {
        "push_enabled": true,
        "sms_enabled": true,
        "email_enabled": true,
        "preferred_language": "en",
        "notification_frequency": "normal"
    },
    
    "household": {
        "size": 4,
        "has_children": true,
        "has_elderly": false
    }
}
*/

-- Structure for ai_profile (system-generated):
/*
{
    "computed_at": "2024-01-15T10:30:00Z",
    
    "behavioral_segments": [
        "health-conscious",
        "weekend-shopper", 
        "premium-buyer"
    ],
    
    "purchase_patterns": {
        "avg_order_value": 450,
        "order_frequency_days": 7,
        "preferred_categories_ranked": ["fruits", "dairy", "vegetables"],
        "time_of_day_preference": "morning",
        "day_of_week_preference": "saturday"
    },
    
    "affinity_scores": {
        "organic": 0.85,
        "premium": 0.72,
        "local": 0.68,
        "new_products": 0.45
    },
    
    "lifecycle_stage": "active",  // new, active, at_risk, churned
    "lifetime_value_tier": "high",
    "predicted_next_order_date": "2024-01-20",
    
    "recommendation_profile": {
        "exploration_score": 0.3,  // How likely to try new products
        "deal_sensitivity": 0.4,
        "reorder_likelihood": 0.8
    },
    
    "embedding_version": "v1",
    "preference_embedding": null  // Future: vector for similarity matching
}
*/

CREATE INDEX IF NOT EXISTS idx_user_preferences 
    ON users USING gin(preferences jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_user_ai_profile 
    ON users USING gin(ai_profile jsonb_path_ops);
```

### 4. Semantic Search Infrastructure

```sql
-- Search queries log for learning
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    
    -- Query details
    query_text TEXT NOT NULL,
    query_normalized TEXT,  -- Lowercase, trimmed
    query_tokens TSVECTOR,
    
    -- Intent classification (future AI)
    detected_intent VARCHAR(100),  -- 'product_search', 'brand_search', 'recipe', 'nutrition'
    detected_entities JSONB,
    /*
    {
        "products": ["mango", "alphonso"],
        "brands": ["farm fresh"],
        "categories": ["fruits"],
        "attributes": ["organic", "500g"]
    }
    */
    
    -- Results
    results_count INT,
    results_shown JSONB,  -- Top 10 product IDs
    
    -- User interaction
    clicked_results JSONB,  -- Product IDs clicked
    added_to_cart JSONB,    -- Product IDs added
    no_results BOOLEAN DEFAULT false,
    
    -- Context
    filters_applied JSONB,
    sort_applied VARCHAR(50),
    page_number INT DEFAULT 1,
    
    -- Feedback
    search_successful BOOLEAN,  -- Did user find what they wanted?
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_search_queries_text ON search_queries USING gin(query_tokens);
CREATE INDEX idx_search_queries_user ON search_queries(user_id, created_at DESC);
CREATE INDEX idx_search_queries_no_results ON search_queries(created_at) WHERE no_results = true;

-- Popular searches cache
CREATE TABLE popular_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_normalized TEXT UNIQUE NOT NULL,
    search_count INT DEFAULT 1,
    click_through_rate DECIMAL(5,4),
    conversion_rate DECIMAL(5,4),
    trending_score DECIMAL(10,4),  -- Calculated daily
    last_searched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_popular_searches_trending ON popular_searches(trending_score DESC);

-- Synonyms and query expansion
CREATE TABLE search_synonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL,
    synonyms TEXT[] NOT NULL,
    category VARCHAR(100),  -- 'product', 'brand', 'attribute'
    is_active BOOLEAN DEFAULT true,
    source VARCHAR(50),  -- 'manual', 'ai_generated', 'user_behavior'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_synonyms_term ON search_synonyms(term) WHERE is_active = true;

-- Seed some synonyms
INSERT INTO search_synonyms (term, synonyms, category, source) VALUES
('mango', ARRAY['aam', 'alphonso', 'hapus', 'mangoes'], 'product', 'manual'),
('milk', ARRAY['doodh', 'dairy', 'whole milk', 'full cream'], 'product', 'manual'),
('tomato', ARRAY['tamatar', 'tomatoes'], 'product', 'manual'),
('organic', ARRAY['natural', 'pesticide-free', 'chemical-free'], 'attribute', 'manual');
```

### 5. Embeddings Table (Vector Search Ready)

```sql
-- Embeddings storage (pgvector-ready)
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source entity
    entity_type VARCHAR(50) NOT NULL,  -- 'product', 'brand', 'category', 'user', 'search_query'
    entity_id UUID NOT NULL,
    
    -- Embedding details
    model VARCHAR(100) NOT NULL,  -- 'text-embedding-3-small', 'text-embedding-ada-002'
    model_version VARCHAR(50),
    dimensions INT NOT NULL,  -- 1536 for OpenAI small, 3072 for large
    
    -- The embedding vector (stored as JSONB until pgvector is installed)
    vector_data JSONB NOT NULL,  -- {"values": [...]}
    -- Future: vector vector(1536)
    
    -- Source text used for embedding
    source_text TEXT NOT NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(entity_type, entity_id, model)
);

CREATE INDEX idx_embeddings_entity ON embeddings(entity_type, entity_id);
CREATE INDEX idx_embeddings_model ON embeddings(model);

-- Future pgvector index (when extension is installed):
-- CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (vector vector_cosine_ops);
```

### 6. Conversation History (for Chat/Agents)

```sql
-- Conversation threads for future chatbot/agent
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    
    -- Conversation metadata
    channel VARCHAR(50) NOT NULL,  -- 'web_chat', 'whatsapp', 'app'
    status VARCHAR(50) DEFAULT 'active',  -- 'active', 'resolved', 'escalated'
    
    -- Context
    context JSONB DEFAULT '{}',
    /*
    {
        "current_order": "order-uuid",
        "cart_value": 500,
        "recent_products": ["prod-1", "prod-2"],
        "user_intent": "product_inquiry"
    }
    */
    
    -- Summary for LLM context window
    conversation_summary TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual messages
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Message details
    role VARCHAR(50) NOT NULL,  -- 'user', 'assistant', 'system', 'tool'
    content TEXT NOT NULL,
    
    -- For tool calls
    tool_call_id VARCHAR(255),
    tool_name VARCHAR(100),
    tool_input JSONB,
    tool_output JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    /*
    {
        "tokens": 150,
        "model": "gpt-4",
        "latency_ms": 850,
        "confidence": 0.92
    }
    */
    
    -- For retrieval/RAG
    retrieved_context JSONB,  -- What was retrieved from knowledge base
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conv_messages_conv ON conversation_messages(conversation_id, created_at);
CREATE INDEX idx_conversations_user ON conversations(user_id, created_at DESC);
```

---

## LLM-Ready Service Patterns

### 1. Product Embedding Service

```python
from typing import List, Optional
import openai
import json

class ProductEmbeddingService:
    """
    Generate and manage product embeddings for semantic search.
    """
    
    MODEL = "text-embedding-3-small"
    DIMENSIONS = 1536
    
    def __init__(self, db_session, openai_client):
        self.db = db_session
        self.openai = openai_client
    
    async def generate_embedding(self, product_id: str) -> List[float]:
        """Generate embedding for a product"""
        
        product = await self.db.query(Product).filter(
            Product.id == product_id
        ).first()
        
        if not product:
            raise ValueError(f"Product not found: {product_id}")
        
        # Build rich text for embedding
        text = self._build_embedding_text(product)
        
        # Generate embedding
        response = await self.openai.embeddings.create(
            model=self.MODEL,
            input=text
        )
        
        embedding = response.data[0].embedding
        
        # Store embedding
        await self._store_embedding(
            entity_type='product',
            entity_id=product_id,
            vector=embedding,
            source_text=text
        )
        
        # Update product ai_metadata
        product.ai_metadata = {
            **product.ai_metadata,
            'embedding_version': 'v1',
            'embedding_model': self.MODEL,
            'last_embedded_at': datetime.utcnow().isoformat(),
            'text_for_embedding': text[:500]  # Store truncated for reference
        }
        
        await self.db.commit()
        
        return embedding
    
    def _build_embedding_text(self, product: Product) -> str:
        """Build rich text representation for embedding"""
        
        parts = [
            f"Product: {product.name}",
            f"Brand: {product.brand.name if product.brand else 'Unknown'}",
            f"Category: {product.category.name if product.category else 'Uncategorized'}",
        ]
        
        if product.description:
            parts.append(f"Description: {product.description}")
        
        if product.short_description:
            parts.append(f"Summary: {product.short_description}")
        
        # Add extended attributes
        attrs = product.attributes_extended or {}
        
        if attrs.get('taste_profile'):
            taste = attrs['taste_profile']
            parts.append(f"Taste: {taste.get('texture', '')}, {taste.get('aroma', '')}")
        
        if attrs.get('dietary'):
            dietary = attrs['dietary']
            dietary_tags = [k for k, v in dietary.items() if v == True]
            if dietary_tags:
                parts.append(f"Dietary: {', '.join(dietary_tags)}")
        
        if attrs.get('sourcing'):
            sourcing = attrs['sourcing']
            if sourcing.get('origin'):
                parts.append(f"Origin: {sourcing['origin']}")
            if sourcing.get('certifications'):
                parts.append(f"Certifications: {', '.join(sourcing['certifications'])}")
        
        if attrs.get('tags'):
            parts.append(f"Tags: {', '.join(attrs['tags'])}")
        
        # Add search keywords from ai_metadata
        ai_meta = product.ai_metadata or {}
        if ai_meta.get('search_keywords'):
            parts.append(f"Keywords: {', '.join(ai_meta['search_keywords'])}")
        
        return "\n".join(parts)
    
    async def batch_embed_products(self, product_ids: List[str]):
        """Batch generate embeddings for multiple products"""
        for product_id in product_ids:
            try:
                await self.generate_embedding(product_id)
            except Exception as e:
                logger.error(f"Failed to embed product {product_id}: {e}")
    
    async def search_similar(
        self,
        query: str,
        limit: int = 10,
        filters: dict = None
    ) -> List[dict]:
        """
        Semantic search using query embedding.
        
        Note: This is a placeholder. In production with pgvector:
        - Generate query embedding
        - Use vector similarity search
        - Combine with filters
        """
        
        # Generate query embedding
        response = await self.openai.embeddings.create(
            model=self.MODEL,
            input=query
        )
        query_embedding = response.data[0].embedding
        
        # TODO: When pgvector is installed:
        # SELECT p.*, 1 - (e.vector <=> :query_vector) as similarity
        # FROM products p
        # JOIN embeddings e ON e.entity_id = p.id AND e.entity_type = 'product'
        # WHERE p.is_active = true
        # ORDER BY e.vector <=> :query_vector
        # LIMIT :limit
        
        # For now, fall back to text search
        return await self._text_search_fallback(query, limit, filters)
```

### 2. User Preference Learning Service

```python
class UserPreferenceLearningService:
    """
    Learn and update user preferences from behavior.
    """
    
    def __init__(self, db_session, event_service):
        self.db = db_session
        self.events = event_service
    
    async def update_preferences_from_orders(self, user_id: str):
        """Analyze orders to update user preferences"""
        
        # Get user's order history
        orders = await self.db.execute("""
            SELECT 
                p.category_id,
                c.name as category_name,
                b.id as brand_id,
                b.name as brand_name,
                p.attributes_extended->'dietary' as dietary,
                COUNT(DISTINCT o.id) as order_count,
                SUM(oi.quantity) as total_units,
                SUM(oi.subtotal) as total_spent
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id
            JOIN categories c ON c.id = p.category_id
            JOIN brands b ON b.id = p.brand_id
            WHERE o.user_id = :user_id
            AND o.status = 'delivered'
            GROUP BY p.category_id, c.name, b.id, b.name, p.attributes_extended->'dietary'
        """, {'user_id': user_id})
        
        # Analyze patterns
        category_affinity = {}
        brand_affinity = {}
        dietary_patterns = {}
        
        for row in orders.fetchall():
            # Category affinity
            cat_id = str(row.category_id)
            category_affinity[cat_id] = category_affinity.get(cat_id, 0) + row.total_spent
            
            # Brand affinity
            brand_id = str(row.brand_id)
            brand_affinity[brand_id] = brand_affinity.get(brand_id, 0) + row.total_spent
            
            # Dietary patterns
            if row.dietary:
                for key, value in row.dietary.items():
                    if value:
                        dietary_patterns[key] = dietary_patterns.get(key, 0) + 1
        
        # Update ai_profile
        user = await self.db.query(User).filter(User.id == user_id).first()
        
        user.ai_profile = {
            **user.ai_profile,
            'computed_at': datetime.utcnow().isoformat(),
            'purchase_patterns': {
                'preferred_categories_ranked': sorted(
                    category_affinity.keys(),
                    key=lambda x: category_affinity[x],
                    reverse=True
                )[:5],
                'preferred_brands_ranked': sorted(
                    brand_affinity.keys(),
                    key=lambda x: brand_affinity[x],
                    reverse=True
                )[:5]
            },
            'inferred_dietary': dietary_patterns
        }
        
        await self.db.commit()
    
    async def compute_affinity_scores(self, user_id: str) -> dict:
        """Compute user's affinity scores for recommendation features"""
        
        user = await self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}
        
        # Get recent events
        events = await self.events.get_user_events(
            user_id=user_id,
            event_types=['product_view', 'add_to_cart', 'order_confirmed'],
            days=30
        )
        
        # Analyze product attributes in interactions
        organic_interactions = 0
        premium_interactions = 0
        local_interactions = 0
        total_interactions = 0
        
        for event in events:
            total_interactions += 1
            props = event.get('properties', {})
            
            # Check product attributes
            # (In production, would look up product attributes)
            if 'organic' in str(props).lower():
                organic_interactions += 1
            if props.get('price', 0) > 300:  # Premium price point
                premium_interactions += 1
        
        if total_interactions > 0:
            affinity_scores = {
                'organic': organic_interactions / total_interactions,
                'premium': premium_interactions / total_interactions,
                'local': local_interactions / total_interactions
            }
        else:
            affinity_scores = {'organic': 0.5, 'premium': 0.5, 'local': 0.5}
        
        # Update ai_profile
        user.ai_profile = {
            **user.ai_profile,
            'affinity_scores': affinity_scores,
            'affinity_computed_at': datetime.utcnow().isoformat()
        }
        
        await self.db.commit()
        
        return affinity_scores
```

### 3. Knowledge Base for RAG

```python
class ProductKnowledgeBase:
    """
    Knowledge base for RAG-based product Q&A and search.
    """
    
    def __init__(self, db_session, embedding_service):
        self.db = db_session
        self.embeddings = embedding_service
    
    async def build_product_context(
        self,
        query: str,
        user_id: Optional[str] = None,
        max_products: int = 5
    ) -> str:
        """
        Build context for LLM from relevant products.
        Used for RAG-based responses.
        """
        
        # Get similar products via semantic search
        similar_products = await self.embeddings.search_similar(
            query=query,
            limit=max_products
        )
        
        if not similar_products:
            return "No relevant products found."
        
        context_parts = ["Relevant products:\n"]
        
        for i, product in enumerate(similar_products, 1):
            context_parts.append(f"""
Product {i}: {product['name']}
- Brand: {product['brand_name']}
- Price: ₹{product['selling_price']}
- In Stock: {'Yes' if product['in_stock'] else 'No'}
- Description: {product['short_description'] or product['description'][:200]}
""")
            
            # Add extended attributes if relevant
            attrs = product.get('attributes_extended', {})
            if attrs.get('dietary'):
                dietary = [k for k, v in attrs['dietary'].items() if v]
                if dietary:
                    context_parts.append(f"- Dietary: {', '.join(dietary)}")
            
            if attrs.get('sourcing', {}).get('origin'):
                context_parts.append(f"- Origin: {attrs['sourcing']['origin']}")
        
        # Add user context if available
        if user_id:
            user_context = await self._get_user_context(user_id)
            if user_context:
                context_parts.append(f"\nUser preferences: {user_context}")
        
        return "\n".join(context_parts)
    
    async def _get_user_context(self, user_id: str) -> str:
        """Get relevant user context for personalization"""
        
        user = await self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return ""
        
        context = []
        
        prefs = user.preferences or {}
        if prefs.get('dietary'):
            dietary = prefs['dietary']
            if dietary.get('vegetarian'):
                context.append("vegetarian")
            if dietary.get('allergies'):
                context.append(f"allergic to: {', '.join(dietary['allergies'])}")
        
        ai_profile = user.ai_profile or {}
        if ai_profile.get('behavioral_segments'):
            context.append(f"customer type: {', '.join(ai_profile['behavioral_segments'][:2])}")
        
        return ", ".join(context) if context else ""
```

---

## Future AI Capabilities (V2+)

### 1. Semantic Product Search
```
User: "healthy breakfast options for kids"
→ Vector search across product embeddings
→ Filter by dietary attributes (kid-friendly)
→ Rank by health_score
→ Return: Oats, muesli, fruits, milk products
```

### 2. Conversational Commerce
```
User: "I need to make mango lassi for 4 people"
→ Intent: Recipe assistance
→ Retrieve: Mango, yogurt, sugar, cardamom
→ Calculate quantities for 4 servings
→ Add to cart with correct quantities
```

### 3. Smart Reordering
```
System detects:
- User typically orders milk every 4 days
- Last order was 3 days ago
- Stock is running low

→ Proactive notification with one-click reorder
```

### 4. Personalized Recommendations
```
Based on:
- Purchase history (category/brand affinity)
- Similar user behavior (collaborative filtering)
- Product embeddings (content-based)
- Current cart context
- Time/season relevance

→ "Customers like you also bought..."
→ "Complete your meal with..."
→ "New arrivals you might like..."
```

---

## Migration Path

### Phase 1 (Current V1)
- Rich JSONB attributes on products/brands/users
- Text-based full-text search
- Event tracking foundation
- Preference storage structure

### Phase 2 (Post-Launch)
- Install pgvector extension
- Migrate embedding storage to vector columns
- Implement basic semantic search
- Add embedding generation pipeline

### Phase 3 (AI Features)
- RAG-based product Q&A
- Personalized recommendations
- Conversational search
- Smart notifications

---

## Environment Variables

```bash
# LLM Configuration (Future)
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4-turbo

# Vector Search (Future)
PGVECTOR_ENABLED=false
EMBEDDING_DIMENSIONS=1536

# Feature Flags
ENABLE_SEMANTIC_SEARCH=false
ENABLE_AI_RECOMMENDATIONS=false
ENABLE_CONVERSATIONAL_COMMERCE=false
```
