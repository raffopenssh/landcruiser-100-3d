#!/usr/bin/env python3
"""
Extract parts from Toyota XML index files
"""

import os
import re
import json
from pathlib import Path
import xml.etree.ElementTree as ET

SAKUIN_DIR = Path("/home/exedev/manual/manual/pub_sys/sakuin")
OUTPUT_FILE = Path("/home/exedev/landcruiser-100-3d/full-parts-database.json")

def categorize_part(name, parts_id):
    """Categorize a part based on its name and parts_id prefix"""
    name_lower = name.lower()
    
    # Category mappings based on part name keywords
    categories = {
        'engine': ['engine', 'cylinder', 'piston', 'crankshaft', 'camshaft', 'valve', 'timing', 'oil pump', 'throttle', 'intake', 'exhaust manifold', 'turbo', 'fuel inject', 'air cleaner', 'air hose', 'spark plug', 'ignition coil'],
        'transmission': ['transmission', 'gear', 'clutch', 'transfer', 'shift', 'torque converter', 'overdrive'],
        'chassis': ['frame', 'cross member', 'body mount', 'subframe'],
        'front_axle': ['front axle', 'front suspension', 'front shock', 'front spring', 'front arm', 'stabilizer front', 'ifs', 'upper arm front', 'lower arm front'],
        'rear_axle': ['rear axle', 'rear suspension', 'rear shock', 'rear spring', 'rear arm', 'stabilizer rear', 'live axle', 'upper arm rear', 'lower arm rear'],
        'steering': ['steering', 'power steering', 'tie rod', 'rack', 'pinion', 'column', 'intermediate shaft'],
        'brakes': ['brake', 'caliper', 'rotor', 'disc', 'drum', 'pad', 'shoe', 'abs', 'master cylinder', 'booster', 'anti squeal'],
        'wheels': ['wheel', 'tire', 'hub', 'bearing', 'lug'],
        'driveshafts': ['drive shaft', 'propeller', 'cv joint', 'u-joint', 'universal joint'],
        'exhaust': ['exhaust', 'muffler', 'catalytic', 'pipe exhaust', 'tailpipe', 'exhaust manifold'],
        'fuel': ['fuel tank', 'fuel pump', 'fuel filter', 'fuel line', 'fuel sender', 'fuel filler', 'accelerator'],
        'cooling': ['radiator', 'coolant', 'thermostat', 'fan', 'water outlet', 'heater core', 'water pump', 'water inlet'],
        'electrical': ['battery', 'alternator', 'starter', 'ignition', 'coil', 'sensor', 'ecu', 'relay', 'fuse', 'wiring', 'harness', 'switch'],
        'body': ['door', 'fender', 'hood', 'bumper', 'grille', 'mirror', 'window', 'windshield', 'roof', 'quarter panel', 'tailgate', 'back door', 'outside handle', 'lock cylinder', 'hinge'],
        'interior': ['seat', 'console', 'dashboard', 'instrument', 'carpet', 'headliner', 'trim', 'airbag', 'air bag', 'seatbelt', 'hvac', 'air condition', 'heater', 'blower', 'assist grip', 'glove', 'cup holder', 'arm rest', 'sun visor'],
        'lighting': ['headlight', 'headlamp', 'tail light', 'tail lamp', 'turn signal', 'fog light', 'fog lamp', 'lamp', 'bulb', 'led', 'light assy']
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in name_lower:
                return category
    
    # Fallback: categorize by parts_id prefix
    if parts_id and len(parts_id) >= 2:
        prefix = parts_id[:2]
        prefix_map = {
            '11': 'engine', '12': 'engine', '13': 'engine', '14': 'engine', '15': 'engine', '16': 'engine', '17': 'engine',
            '21': 'cooling', '22': 'fuel', '23': 'electrical',
            '31': 'transmission', '32': 'transmission', '33': 'transmission', '35': 'transmission',
            '41': 'driveshafts', '42': 'rear_axle', '43': 'front_axle', '44': 'brakes', '45': 'steering', '46': 'steering',
            '48': 'front_axle', '49': 'rear_axle',
            '51': 'chassis', '52': 'body', '53': 'body', '55': 'interior', '56': 'body',
            '61': 'body', '62': 'body', '63': 'body', '64': 'interior', '65': 'body', '66': 'body', '67': 'body', '68': 'body', '69': 'body',
            '71': 'interior', '72': 'interior', '73': 'interior', '74': 'interior', '75': 'interior',
            '76': 'interior', '77': 'fuel', '78': 'fuel', '79': 'interior',
            '81': 'lighting', '82': 'electrical', '83': 'electrical', '84': 'electrical', '85': 'electrical', '86': 'electrical', '87': 'interior', '88': 'interior', '89': 'electrical',
            '04': 'brakes'  # Anti-squeal shims etc
        }
        if prefix in prefix_map:
            return prefix_map[prefix]
    
    return 'other'

def extract_parts_from_xml(filepath):
    """Extract parts from a sakuin XML file"""
    parts = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse XML-like structure using regex (more robust for malformed XML)
        pattern = r'<parts parts-id="([^"]+)" p-type="(\d+)"><name>([^<]+)</name></parts>'
        matches = re.findall(pattern, content)
        
        for parts_id, p_type, name in matches:
            # p_type 1 = actual parts with part numbers
            # p_type 2 = procedures/descriptions  
            # p_type 3 = other
            if p_type == '1':  # Only actual parts
                parts.append({
                    'parts_id': parts_id,
                    'name': name.strip(),
                    'category': categorize_part(name, parts_id)
                })
                
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
    
    return parts

def main():
    print("Extracting parts from XML index files...")
    all_parts = []
    
    for xml_file in SAKUIN_DIR.glob("*.xml"):
        parts = extract_parts_from_xml(xml_file)
        all_parts.extend(parts)
        if parts:
            print(f"Found {len(parts)} parts in {xml_file.name}")
    
    # Deduplicate by parts_id
    seen = {}
    unique_parts = []
    for part in all_parts:
        pid = part['parts_id']
        if pid not in seen:
            seen[pid] = part
            unique_parts.append(part)
    
    # Group by category
    categorized = {}
    for part in unique_parts:
        cat = part['category']
        if cat not in categorized:
            categorized[cat] = []
        categorized[cat].append({
            'name': part['name'],
            'parts_id': part['parts_id']
        })
    
    # Sort parts within each category
    for cat in categorized:
        categorized[cat].sort(key=lambda x: x['name'])
    
    # Print summary
    print(f"\n=== Summary ===")
    print(f"Total unique parts: {len(unique_parts)}")
    for cat, parts_list in sorted(categorized.items(), key=lambda x: -len(x[1])):
        print(f"  {cat}: {len(parts_list)} parts")
    
    result = {
        'total_parts': len(unique_parts),
        'categories': categorized
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"\nOutput saved to: {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
