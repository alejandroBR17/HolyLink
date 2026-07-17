import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("Film } from 'lucide-react';", "Film, Volume2, VolumeX, Pin, PinOff, Repeat } from 'lucide-react';")

with open('src/App.tsx', 'w') as f:
    f.write(content)
