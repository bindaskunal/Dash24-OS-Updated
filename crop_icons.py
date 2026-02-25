import cv2
import numpy as np

# Load the image
image = cv2.imread('frontend/public/header-icons.png')
if image is None:
    print("Could not load frontend/public/header-icons.png")
    exit(1)

# Ensure it's in a known format for cropping calculations
height, width = image.shape[:2]

# The image is a single row of 5 icons. 
# We'll split the width into 5 equal parts.
num_icons = 5
icon_width = width // num_icons

icon_names = ["home", "beauty", "electronics", "wearables", "health"]

for i in range(num_icons):
    # Calculate crop coordinates
    x_start = i * icon_width
    x_end = (i + 1) * icon_width if i < num_icons - 1 else width
    
    # Crop the icon
    icon = image[0:height, x_start:x_end]
    
    # Save the icon
    cv2.imwrite(f'frontend/public/icon-{icon_names[i]}.png', icon)
    print(f"Saved frontend/public/icon-{icon_names[i]}.png")

print("Done cropping icons.")
