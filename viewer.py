import json
import os
file = os.path.join(os.path.dirname(__file__), 'server_info.json')
print("Servers Found:")
  
with open(file, 'r') as file:
    itemNum = 0
    data = json.load(file)
    # print(data)
    for item in data:
        print("-" * 25)
        print("IP:", data[itemNum]["ip"])
        print("Version:", data[itemNum]["version"])
        print("-" * 25)
        itemNum += 1

input('Press Enter to Continue!')
