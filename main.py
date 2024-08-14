import os

# Define the list of directories to ignore
IGNORE_DIRS = ['node_modules', '.git', '.venv']

# Define the list of files to ignore
IGNORE_FILES = ['package.json', 'package-lock.json', 'codebase_report.txt']

def generate_report(directory, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        tree = generate_tree(directory)
        f.write(tree)
        f.write('\n')
        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file in files:
                if file in IGNORE_FILES or file == os.path.basename(__file__):
                    continue
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, directory)
                f.write(f'{relative_path}:\n')
                f.write('=' * 77 + '\n')
                try:
                    with open(file_path, 'r', encoding='utf-8') as file_content:
                        f.write(file_content.read())
                except UnicodeDecodeError:
                    f.write('NOT READABLE')
                f.write('\n' + '=' * 77 + '\n\n')

def generate_tree(directory):
    tree = ''
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        level = root.replace(directory, '').count(os.sep)
        indent = '|  ' * level
        relative_path = os.path.relpath(root, directory)
        if relative_path == '.':
            tree += f'{indent}+-- {os.path.basename(directory)}\n'
        else:
            tree += f'{indent}+-- {os.path.basename(relative_path)}\n'
        for file in files:
            if file in IGNORE_FILES or file == os.path.basename(__file__):
                continue
            tree += f'{indent}|   +-- {file}\n'
    return tree

if __name__ == '__main__':
    current_directory = os.getcwd()
    output_file = 'codebase_report.txt'
    generate_report(current_directory, output_file)
    print(f'Report generated: {output_file}')