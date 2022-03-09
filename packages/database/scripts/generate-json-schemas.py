import os

command_base = 'typescript-json-schema'
params = '--required --noExtraProps --defaultProps'
input_path = '../../shared/'
output_path = '../schemas/'

files_and_classes = [
    {'file': input_path + 'types/actant.ts', 'class': 'IActant'},
    {'file': input_path + 'types/concept.ts', 'class': 'IConcept'},
    {'file': input_path + 'types/object.ts', 'class': 'IObject'},
    {'file': input_path + 'types/entity.ts', 'class': 'IEntity'},
    {'file': input_path + 'types/label.ts', 'class': 'ILabel'},
    {'file': input_path + 'types/statement.ts', 'class': 'IStatement'},
    {'file': input_path + 'types/territory.ts', 'class': 'ITerritory'},
    {'file': input_path + 'types/resource.ts', 'class': 'IResource'},
    {'file': input_path + 'types/prop.ts', 'class': 'IProp'},
    {'file': input_path + 'types/value.ts', 'class': 'IValue'},
    {'file': input_path + 'types/action.ts', 'class': 'IAction'},
    {'file': input_path + 'types/user.ts', 'class': 'IUser'},
]

for case in files_and_classes:
    command = command_base + " " + case['file'] + " " + case['class'] + " " + params + " --id " + case['class'] + " --out " + output_path+case['class'] + '.schema.json'
    print(command)
    os.system(command)
