// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface Repository {
    name: string;
    url: string;
}

const github_repositories: Repository[] = [
    { name: 'NuEdgeWise', url: 'https://github.com/OpenNuvoton/NuEdgeWise' },
    { name: 'ML_G-Sensor', url: 'https://github.com/OpenNuvoton/ML_G-Sensor' },
    { name: 'ML_KWS', url: 'https://github.com/OpenNuvoton/ML_KWS' },
    { name: 'ML_Image_Classification', url: 'https://github.com/OpenNuvoton/ML_Image_Classification' },
    { name: 'ML_Gearbox_Fault_Diagnosis', url: 'https://github.com/OpenNuvoton/ML_Gearbox_Fault_Diagnosis' },
    { name: 'ML_VWW', url: 'https://github.com/OpenNuvoton/ML_VWW' },
    { name: 'ML_YOLO', url: 'https://github.com/OpenNuvoton/ML_YOLO' }
];

function findCondaPath() {
    const commonPaths = [
        'C:\\ProgramData\\miniforge3',
        'C:\\Users\\%USERNAME%\\miniforge3',
        'C:\\ProgramData\\Miniconda3',
        'C:\\Users\\%USERNAME%\\Miniconda3'
    ];

    for (const basePath of commonPaths) {
        const condaBinPath = path.join(basePath, 'condabin');
        if (fs.existsSync(condaBinPath)) {
            return condaBinPath;
        }
    }

    throw new Error('Conda installation not found.');
}

export function activate(context: vscode.ExtensionContext) {
    const cloneRepos = vscode.commands.registerCommand('nuedgewise.cloneRepos', async () => {
        // Prompt user for repository URLs
        const repoUrls = await vscode.window.showInputBox({
            prompt: 'Enter GitHub repository URLs separated by commas',
           // placeHolder: 'https://github.com/OpenNuvoton/NuEdgeWise, https://github.com/OpenNuvoton/ML_G-Sensor',
           value: github_repositories.map(repo => repo.url).join(', '),
        });

        if (!repoUrls) {
            vscode.window.showErrorMessage('No repository URLs provided.');
            return;
        }

        // Prompt user to select a destination folder
        const destinationUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            openLabel: 'Select Parent Folder for Cloning',
        });

        if (!destinationUri || destinationUri.length === 0) {
            vscode.window.showErrorMessage('No destination folder selected.');
            return;
        }

        const parentPath = destinationUri[0].fsPath;

        // Prompt user for the directory name to create
        //const folderName = await vscode.window.showInputBox({
        //    prompt: 'Enter a name for the new folder where repositories will be cloned',
        //    placeHolder: 'my_repos',
        //});
		const folderName = 'NuEdgeWise'; // use default folder name

        if (!folderName) {
            vscode.window.showErrorMessage('No folder name provided.');
            return;
        }

        // Create the directory
        const newFolderPath = path.join(parentPath, folderName);
        if (!fs.existsSync(newFolderPath)) {
            fs.mkdirSync(newFolderPath, { recursive: true });
        }

        // Create or reuse an integrated terminal in VS Code
        //let terminal = vscode.window.terminals.find(t => t.name === "Git Clone Terminal");
        //if (!terminal) {
        //    terminal = vscode.window.createTerminal("Git Clone Terminal");
        //}
        //terminal.show();

        // Clone repositories inside the created directory
        const urls = repoUrls.split(',').map(url => url.trim());
        const url_len = urls.length;
        let successCount = 0;

        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Cloning Repositories...",
                cancellable: false,
            },
            async (progress) => {
                for (const url of urls) {
                    progress.report({ message: `Cloning ${url}...` });

                    try {
                        // Use execSync (The other way)
                        child_process.execSync(`git clone ${url}`, { cwd: newFolderPath });
                        vscode.window.showInformationMessage(`Successfully cloned ${url}`);
                        successCount++;

                        // Use terminal.sendText
                        //terminal.sendText(`cd "${newFolderPath}"`);
                        //terminal.sendText(`git clone ${url}`);
                        //terminal.sendText(`echo DONE > setup_complete.txt`);
                        //await new Promise<void>((resolve, reject) => {
                        //    const checkDone = setInterval(() => {
                        //        const doneFilePath = path.join(newFolderPath, "setup_complete.txt");
                        //        if (fs.existsSync(doneFilePath)) {
                        //            clearInterval(checkDone);
                        //            fs.unlinkSync(doneFilePath); // Clean up marker file
                        //            successCount++;
                        //            vscode.window.showInformationMessage(`Successfully cloned ${url}`);
                        //            resolve();
                        //        }
                        //      
                        //    }, 2000);
                        //});
                    } catch (err : any) {
                        vscode.window.showErrorMessage(`Failed to clone ${url}: ${err.message}`);
                    }
                    
                }
                if (successCount === url_len) {
                    vscode.window.showInformationMessage(`All repositories have been cloned into ${newFolderPath}`);
                }
                else{
                    vscode.window.showErrorMessage(`Failed to clone all repositories`);
                }
                
            }
        );
    });

	// Command to set up a Python environment (supports venv and Conda)
	const setupPythonEnv = vscode.commands.registerCommand('nuedgewise.setupPythonEnv', async () => {

       const projectUri = await vscode.window.showOpenDialog({
           canSelectFolders: true,
           openLabel: 'Select Project/NuEdgeWise Folder for Python Environment Setup',
       });
       if (!projectUri || projectUri.length === 0) {
           vscode.window.showErrorMessage('No project folder selected.');
           return;
       }
       const projectPath = projectUri[0].fsPath;

       // Ask user to choose between venv and Conda
       const envType = await vscode.window.showQuickPick(["Conda"], {
           placeHolder: "Select the type of Python environment to create",
       });
       if (!envType) {
           vscode.window.showErrorMessage("No environment type selected.");
           return;
       }

       // Prompt user for the environment name
       const envName = await vscode.window.showInputBox({
           prompt: "Enter a name for the Conda environment",
           //placeHolder: "NuEdgeWise_env_test",
           value: 'test_NuEdgeWise_env',
       });
       if (!envName) {
           vscode.window.showErrorMessage("No environment name provided.");
           return;
       }

       vscode.window.withProgress({
           location: vscode.ProgressLocation.Notification,
           title: "Setting up Python environment...",
           cancellable: false,
       }, async (progress) => {

           // Ensure the setting is applied globally
           //await vscode.workspace.getConfiguration().update('terminal.integrated.shellIntegration.enabled', false, vscode.ConfigurationTarget.Global);

           // Create or reuse an integrated terminal in VS Code
           //let terminal = vscode.window.terminals.find(t => t.name === "Setup Python Env Terminal");
           //if (!terminal) {
           //    terminal = vscode.window.createTerminal("Setup Python Env Terminal");
           //}
           //terminal.show();
           
           if (envType === "Virtualenv (venv)") {
			// Check if Python is installed
			progress.report({ message: "Checking Python installation..." });
               try {
                   child_process.execSync('python --version');
               } catch (err: any) {
                   vscode.window.showErrorMessage('Python is not installed or not added to PATH.');
                   return;
               }
               // Create a virtual environment
               const venvPath = path.join(projectPath, 'venv');
               try {
                   progress.report({ message: "Creating virtual environment..." });
                   child_process.execSync(`python -m venv ${venvPath}`, { cwd: projectPath });
                   vscode.window.showInformationMessage('Python virtual environment successfully created.');
               } catch (err: any) {
                   vscode.window.showErrorMessage(`Failed to create Python virtual environment: ${err.message}`);
                   return;
               }
               // Install dependencies if requirements.txt exists
               const requirementsPath = path.join(projectPath, 'requirements.txt');
               if (fs.existsSync(requirementsPath)) {
                   try {
                       progress.report({ message: "Installing dependencies from requirements.txt..." });
                       const pipPath = path.join(venvPath, 'Scripts', 'pip');
                       child_process.execSync(`${pipPath} install -r requirements.txt`, { cwd: projectPath });
                       vscode.window.showInformationMessage('Dependencies successfully installed.');
                   } catch (err: any) {
                       vscode.window.showErrorMessage(`Failed to install dependencies: ${err.message}`);
                   }
               } else {
                   vscode.window.showInformationMessage('No requirements.txt found. Skipping dependency installation.');
               }
           } else if (envType === "Conda") {
               // Check if Conda is installed
               try {
                   // Find the Conda installation location
                   const condaBinPath = findCondaPath();

                   // Use execSync
                   process.env.PATH = `${condaBinPath};${process.env.PATH}`;
                   child_process.execSync('conda --version');
                   vscode.window.showInformationMessage(`Use Conda. Path: ${condaBinPath}`);

                   // Use terminal
                   //terminal.sendText(`export PATH=${condaBinPath}:$PATH`);
                   //terminal.sendText(`$env:Path += ';${condaBinPath}'`);
                   //terminal.sendText(`cd "${projectPath}"`);
                   //terminal.sendText('conda --version');

               } catch (err: any) {
                   vscode.window.showErrorMessage('Conda is not installed or not added to PATH.');
                   return;
               }

               try {
                   // Create a Conda environment
                   progress.report({ message: "Creating Conda environment..." });

                   // Use execSync
                   child_process.execSync(`conda create -y -n ${envName} python=3.9.13`, { cwd: projectPath });
                   vscode.window.showInformationMessage(`Conda environment '${envName}' created.`);

                   // Use terminal
                   //terminal.sendText(`conda create -y -n ${envName} python=3.8.13`);
                   //terminal.sendText(`echo DONE > conda_create_done.txt`);
                   //await new Promise<void>((resolve, reject) => {
                   //     const checkDone = setInterval(() => {
                   //       const doneFilePath = path.join(projectPath, "conda_create_done.txt");
                   //       if (fs.existsSync(doneFilePath)) {
                   //            clearInterval(checkDone);
                   //            fs.unlinkSync(doneFilePath); // Clean up marker file
                   //            vscode.window.showInformationMessage(`Conda environment '${envName}' created.`);
                   //            resolve();
                   //       }
                   //     }, 2000);
                   //});

                   // Install dependencies if requirements.txt exists
                   const requirementsPath = path.join(projectPath, 'requirements.txt');
                   if (fs.existsSync(requirementsPath)) {
                       try {
                           // Use execSync 
                           progress.report({ message: "Upgrade pip..." });
                           child_process.execSync(`conda run -n ${envName} python -m pip install --upgrade pip setuptools`, { cwd: projectPath });
                           progress.report({ message: "Installing dependencies in Conda environment..." });
                           child_process.execSync(`conda run -n ${envName} python -m pip install -r requirements.txt`, { cwd: projectPath });
                           vscode.window.showInformationMessage('Dependencies successfully installed in ${envName}.');

                           // Use terminal
                           //terminal.sendText(`conda run -n ${envName} python -m pip install --upgrade pip setuptools`);
                           //terminal.sendText(`conda activate ${envName}`);
                           //terminal.sendText(`python -m pip install -r requirements.txt`);
                           //terminal.sendText(`echo DONE > install_dep_done.txt`);
                           //await new Promise<void>((resolve, reject) => {
                           //     const checkDone = setInterval(() => {
                           //       const doneFilePath = path.join(projectPath, "install_dep_done.txt");
                           //       if (fs.existsSync(doneFilePath)) {
                           //            clearInterval(checkDone);
                           //            fs.unlinkSync(doneFilePath); // Clean up marker file
                           //            vscode.window.showInformationMessage(`Install dependencies in '${envName}' done.`);
                           //            resolve();
                           //       }
                           //     }, 2000);
                           //});
                           
                       } catch (err: any) {
                           vscode.window.showErrorMessage(`Failed to install dependencies: ${err.message}`);
                       }
                   } else {
                       vscode.window.showInformationMessage('No requirements.txt found. Skipping dependency installation.');
                   }
               } catch (err: any) {
                   vscode.window.showErrorMessage(`Failed to create Conda environment: ${err.message}`);
               }
           }
       });
    });

    context.subscriptions.push(cloneRepos, setupPythonEnv);
}

// This method is called when your extension is deactivated
export function deactivate() {}
