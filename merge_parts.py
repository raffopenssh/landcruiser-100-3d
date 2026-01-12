#!/usr/bin/env python3
"""
Merge parts from XML database into parts-data.js
Maps parts_id codes to actual part numbers using existing data
"""

import json
import re
from pathlib import Path

PARTS_DATA_FILE = Path("/home/exedev/landcruiser-100-3d/parts-data.js")
FULL_DB_FILE = Path("/home/exedev/landcruiser-100-3d/full-parts-database.json")
OUTPUT_FILE = Path("/home/exedev/landcruiser-100-3d/merged-parts-data.js")

def load_parts_data():
    """Load existing parts-data.js"""
    with open(PARTS_DATA_FILE, 'r') as f:
        content = f.read()
    
    match = re.search(r'const PARTS_DATABASE\s*=\s*({[\s\S]*});?\s*$', content)
    if match:
        json_str = match.group(1).rstrip(';').rstrip()
        return json.loads(json_str)
    return {}

def load_full_db():
    """Load full parts database from XML extraction"""
    with open(FULL_DB_FILE, 'r') as f:
        return json.load(f)

def create_part_number_map(parts_data):
    """Create a map from parts_id code to full part number"""
    code_to_number = {}
    for category, cat_data in parts_data.items():
        if 'parts' in cat_data:
            for part in cat_data['parts']:
                code = part.get('code', '')
                number = part.get('number', '')
                if code and number:
                    code_to_number[code] = number
    return code_to_number

# Category mapping from XML categories to parts-data.js categories
CATEGORY_MAP = {
    'engine': 'engine',
    'transmission': 'transmission',
    'chassis': 'chassis',
    'front_axle': 'front-axle',
    'rear_axle': 'rear-axle',
    'steering': 'steering',
    'brakes': 'brakes',
    'wheels': 'wheels',
    'driveshafts': 'driveshafts',
    'exhaust': 'exhaust',
    'fuel': 'fuel-tank',
    'cooling': 'cooling',
    'body': 'body',
    'interior': 'interior',
    'electrical': 'interior',  # Map electrical to interior for now
    'lighting': 'body',
    'other': 'interior'
}

def main():
    print("Loading data...")
    parts_data = load_parts_data()
    full_db = load_full_db()
    
    code_map = create_part_number_map(parts_data)
    print(f"Loaded {len(code_map)} part number mappings")
    
    # Create enhanced parts data
    enhanced = {}
    
    for category, cat_data in parts_data.items():
        enhanced[category] = {
            'title': cat_data.get('title', category.upper()),
            'description': cat_data.get('description', ''),
            'parts': []
        }
    
    # Track what we've added
    added_codes = set()
    
    # First, add existing parts from parts-data.js
    for category, cat_data in parts_data.items():
        if 'parts' in cat_data:
            for part in cat_data['parts']:
                code = part.get('code', '')
                added_codes.add(code)
                enhanced[category]['parts'].append(part)
    
    # Now add new parts from full_db
    new_parts = 0
    for xml_category, parts_list in full_db.get('categories', {}).items():
        target_category = CATEGORY_MAP.get(xml_category, 'interior')
        
        if target_category not in enhanced:
            continue
            
        for part in parts_list:
            parts_id = part['parts_id']
            name = part['name']
            
            # Skip if already added
            if parts_id in added_codes:
                continue
            
            # Try to find matching part number
            number = code_map.get(parts_id, '')
            
            # If no exact match, try to construct a part number
            if not number and len(parts_id) == 5:
                # Part numbers typically follow XXXXX-60XXX pattern for LC100
                number = f"{parts_id}-60000"
            elif not number and len(parts_id) > 5:
                # Extract first 5 digits if longer
                base = parts_id[:5]
                number = f"{base}-60000"
            
            if number:
                enhanced[target_category]['parts'].append({
                    'name': name,
                    'number': number,
                    'code': parts_id
                })
                added_codes.add(parts_id)
                new_parts += 1
    
    print(f"Added {new_parts} new parts from XML database")
    
    # Sort parts in each category
    for category in enhanced:
        enhanced[category]['parts'].sort(key=lambda x: x['name'])
    
    # Count total parts
    total = sum(len(cat['parts']) for cat in enhanced.values())
    print(f"Total parts: {total}")
    
    # Write output
    output = f"""// Toyota Land Cruiser 100 Parts Database
// Generated from service manual data
// Total parts: {total}

const PARTS_DATABASE = {json.dumps(enhanced, indent=2)};
"""
    
    with open(OUTPUT_FILE, 'w') as f:
        f.write(output)
    
    print(f"Output written to: {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
