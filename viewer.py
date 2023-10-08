import json
import os

print("Servers Found:")
with open (f"{os.getcwd()}\\server_info.json") as file:
    itemNum = 0
    data = json.load(file)
    for item in data:
        print("-" * 25)
        print("IP:", data[itemNum]["ip"])
        print("Version:", data[itemNum]["version"])
        print("-" * 25)
        itemNum += 1

os.system("pause")
