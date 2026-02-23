import json
import os
import requests
import time
from dotenv import load_dotenv, find_dotenv

# Load environment variables from .env file
load_dotenv(find_dotenv())

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip() or None
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip() or None

# Input and output paths
INPUT_FILE = "frontend/data/catalog.json"
OUTPUT_FILE = "frontend/data/enriched_catalog.json"

# Ensure Output Directory Exists
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)


def query_gemini(prompt):
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not found. Returning mock data.")
        return mock_llm_response(prompt)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }

    max_retries = 4
    delay = 4  # Start with a 4-second delay

    for attempt in range(max_retries):
        try:
            response = requests.post(url, headers=headers, json=data)
            
            # Handle Rate Limit specifically
            if response.status_code == 429:
                print(f"[Rate Limit] 429 Too Many Requests. Waiting {delay}s before continuing...")
                time.sleep(delay)
                delay *= 2  # Exponential backoff (4s, 8s, 16s)
                continue
                
            response.raise_for_status()
            result = response.json()
            return result['candidates'][0]['content']['parts'][0]['text']
            
        except Exception as e:
            print(f"Error querying Gemini: {e}")
            return mock_llm_response(prompt)
            
    print("Max retries exceeded for Gemini API.")
    return mock_llm_response(prompt)

def query_openai(prompt):
    if not OPENAI_API_KEY:
        print("OPENAI_API_KEY not found. Returning mock data.")
        return mock_llm_response(prompt)
    
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    data = {
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']
    except Exception as e:
        print(f"Error querying OpenAI: {e}")
        return mock_llm_response(prompt)


def mock_llm_response(prompt):
    """Fallback if no API keys are provided."""
    return '''{
  "clarification": "Mock clarification intent",
  "risk": "Mock risk intent",
  "outcome": "Mock outcome intent",
  "comparison": "Mock comparison intent",
  "value": "Mock value intent",
  "personalization": "Mock personalization intent"
}'''


def generate_prompt(product):
    return f"""
Act as the Dash24 Lead Engineer. We are building a 'Conversational Decisioning' engine. 
Analyze the following product and generate 6 intent layers: Clarification, Risk, Outcome, Comparison, Value, and Personalization.

Product Name: {product.get('name')}
Brand: {product.get('brand')}
Price: {product.get('price')}

Respond strictly with ONLY a valid JSON object. Do not include markdown formatting or backticks around the json block. 
The JSON keys must be exactly: "clarification", "risk", "outcome", "comparison", "value", "personalization".

Ensure all responses feature the 'Dash24 Live Pulse' logic, emphasizing Bangalore delivery and strict genuine quality.
"""

def enrich_catalog():
    print(f"Reading catalog from {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, "r") as f:
            catalog = json.load(f)
    except Exception as e:
        print(f"Failed to read input file: {e}")
        return

    enriched_catalog = []

    print(f"Processing {len(catalog)} products...")
    for idx, product in enumerate(catalog):
        print(f"[{idx+1}/{len(catalog)}] Processing {product.get('name', 'Unknown')}...")
        
        prompt = generate_prompt(product)
        
        # You can toggle this to query_openai(prompt) if preferred
        response_text = query_gemini(prompt)
        
        try:
            # Clean up potential markdown formatting from LLM response
            cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
            ai_intent_layers = json.loads(cleaned_text)
            
            # Add to product dict
            product['ai_intent_layers'] = ai_intent_layers
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON for {product.get('name')}. Skipping enrichment.")
            print(f"Raw Response: {response_text}")
            product['ai_intent_layers'] = None
        
        enriched_catalog.append(product)
        time.sleep(1) # Simple rate limiting

    print(f"Writing enriched catalog to {OUTPUT_FILE}...")
    try:
        with open(OUTPUT_FILE, "w") as f:
            json.dump(enriched_catalog, f, indent=2)
        print("Success! Enriched catalog saved.")
    except Exception as e:
        print(f"Failed to write output file: {e}")


if __name__ == "__main__":
    enrich_catalog()
