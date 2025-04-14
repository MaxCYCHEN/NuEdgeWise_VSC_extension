// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from "os";

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

function resolvePath(inputPath: string): string {
  const userHome = os.homedir();
  //vscode.window.showInformationMessage(userHome);

  // Replace macros
  let finalPath = inputPath
    .replace("${userHome}", userHome);

  // Resolve relative paths against workspace
  if (!path.isAbsolute(finalPath)) {
    finalPath = path.join(userHome, finalPath);
  }

  return finalPath;
}

function findCondaPath() {
  const currentUsername = os.userInfo().username;
    const commonPaths = [
        `C:\\ProgramData\\miniforge3`,
        `C:\\Users\\${currentUsername}\\AppData\\Local\\miniforge3`,
        `C:\\Users\\${currentUsername}\\miniforge3`,
        `C:\\ProgramData\\Miniconda3`,
        `C:\\Users\\${currentUsername}\\Miniconda3`,
        `C:\\Users\\${currentUsername}\\AppData\\Local\\Miniconda3`
    ];

    // get py destination folder from config
    const config = vscode.workspace.getConfiguration("nuEdgeWisePythonEnv");
    const rawPath = config.get<string>("addingCondaBinPath") || path.join("${userHome}", "miniforge3");
    const newFolderPath = resolvePath(rawPath);

    commonPaths.push(newFolderPath);

    for (const basePath of commonPaths) {
        const condaBinPath = path.join(basePath, 'condabin');
        if (fs.existsSync(condaBinPath)) {
            return condaBinPath;
        }
    }

    throw new Error('Conda installation not found.');
}

export function activate(context: vscode.ExtensionContext) {
    const cloneRepos = vscode.commands.registerCommand('nuedgewise.cloneRepos', async ( repo_test: any) => {
        // Prompt user for repository URLs
        if (!repo_test) {
          repo_test = github_repositories.map(repo => repo.url);
        }
        const repoUrls = await vscode.window.showInputBox({
            prompt: 'Enter GitHub repository URLs separated by commas',
           //value: github_repositories.map(repo => repo.url).join(', '),
            value: repo_test.join(', '),
        });

        if (!repoUrls) {
            vscode.window.showErrorMessage('No repository URLs provided.');
            return;
        }

        // Prompt user to select a destination folder
        //const destinationUri = await vscode.window.showOpenDialog({
        //    canSelectFolders: true,
        //    openLabel: 'Select Parent Folder for Cloning',
        //});
        //if (!destinationUri || destinationUri.length === 0) {
        //    vscode.window.showErrorMessage('No destination folder selected.');
        //    return;
        //}
        //const parentPath = destinationUri[0].fsPath;

        // Prompt user for the directory name to create
		    //const folderName = 'NuEdgeWise'; // use default folder name
        //if (!folderName) {
        //    vscode.window.showErrorMessage('No folder name provided.');
        //    return;
        //}
        // Create the directory
        //const newFolderPath = path.join(parentPath, folderName);
        //if (!fs.existsSync(newFolderPath)) {
        //    fs.mkdirSync(newFolderPath, { recursive: true });
        //}

        // get py destination folder from config
        const config = vscode.workspace.getConfiguration("nuEdgeWisePythonEnv");
        const rawPath = config.get<string>("defaultNuEdgeWisePath") || path.join("${userHome}", "NuEdgeWise");
        const newFolderPath = resolvePath(rawPath);
        // Create the directory
        if (!fs.existsSync(newFolderPath)) {
          fs.mkdirSync(newFolderPath, { recursive: true });
        }

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
	const setupPythonEnv = vscode.commands.registerCommand('nuedgewise.setupPythonEnv', async (msg_envType: string, msg_envName: string) => {
       // User choose manually
       //const projectUri = await vscode.window.showOpenDialog({
       //    canSelectFolders: true,
       //    openLabel: 'Select Project/NuEdgeWise Folder for Python Environment Setup',
       //});
       //if (!projectUri || projectUri.length === 0) {
       //    vscode.window.showErrorMessage('No project folder selected.');
       //    return;
       //}
       //const projectPath = projectUri[0].fsPath;

       // get py destination folder from config
       const config = vscode.workspace.getConfiguration("nuEdgeWisePythonEnv");
       const rawPath = config.get<string>("defaultNuEdgeWisePath") || path.join("${userHome}", "NuEdgeWise");
       const newFolderPath = resolvePath(rawPath);
       const projectPath = path.join(newFolderPath, "NuEdgeWise");

       // Ask user to choose between venv and Conda
       let envType = await vscode.window.showQuickPick(["Conda"], {
           placeHolder: "Select the type of Python environment to create",
       });
       if (msg_envType) {
           envType = msg_envType;
       }
       if (!envType && !msg_envType) {
           vscode.window.showErrorMessage("No environment type selected.");
           return;
       }

       // Prompt user for the environment name
       if (!msg_envName) {
        msg_envName = 'NuEdgeWise_env';
       }
       const envName = await vscode.window.showInputBox({
           prompt: "Enter a name for the Conda environment",
           //value: 'test_NuEdgeWise_env',
           value: msg_envName,
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
                           vscode.window.showInformationMessage(`Dependencies successfully installed in '${envName}'.`);

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

    let runVela = vscode.commands.registerCommand('nuedgewise.runVela', async (optimize?: string, acc_cfg?: string, sys_cfg?: string) => {
      
      // choose the input tflite file
      const fileUri = await vscode.window.showOpenDialog({ 
          canSelectMany: false, 
          filters: { 'TFLite Files': ['tflite'] },
          openLabel: 'Select Your TFLite File',
      });
      if (!fileUri) return;
      const inputFile = fileUri[0].fsPath;

      const defaultOutput = path.join(path.dirname(inputFile));

      // choose the output vela_tflite file
      const outputUri = await vscode.window.showOpenDialog({
        defaultUri: vscode.Uri.file(defaultOutput),
        canSelectFolders: true,
        openLabel: 'Select Output Vela TFLite Folder',
      });
      if (!outputUri || outputUri.length === 0) {
          vscode.window.showErrorMessage('No project folder selected.');
          return;
      }

      // Get the EXE path inside the extension
      const exePath = context.asAbsolutePath(path.join('resources', 'vela-4_0_1.exe'));
      const vela_conf_file = context.asAbsolutePath(path.join('resources', 'default_vela.ini'));
      //const vela_conf_file = '../resources/default_vela.ini';

      const outputFile = outputUri[0].fsPath;
      const optimizeFlag = optimize ? `${optimize}` : 'Performance';
      const acc_config = acc_cfg ? `${acc_cfg}`: 'ethos-u55-256';
      const system_config = sys_cfg ? `${sys_cfg}` : 'Ethos_U55_High_End_Embedded';
      const memory_mode = 'Shared_Sram';

      const terminal = vscode.window.createTerminal("TFLite Runner");
      terminal.show();
      terminal.sendText(`${exePath} "${inputFile}" --accelerator-config ${acc_config} `+
        `--optimise ${optimizeFlag} --config ${vela_conf_file} --memory-mode ${memory_mode} `+
        `--system-config ${system_config} --output-dir "${outputFile}"`);
    });

    const cloneReposSidebar = vscode.window.registerWebviewViewProvider("cloneSidebar", {
        resolveWebviewView(webviewView) {
          webviewView.webview.options = {
            enableScripts: true,
          };
      
          webviewView.webview.html = getWebviewContent_cloneSidebar();
          webviewView.webview.onDidReceiveMessage((message) => {
            if (message.command === "clone") {
              const repos = message.repos.filter((repo: string) => repo.trim() !== "");
              if (repos.length > 0) {
                vscode.commands.executeCommand("nuedgewise.cloneRepos", repos);
              } else {
                vscode.window.showErrorMessage("No repositories selected.");
              }
            }
          });
        },
      });

    const pythonEnvSetSidebar = vscode.window.registerWebviewViewProvider("pythonEnvSidebar", {
      resolveWebviewView(webviewView) {
        webviewView.webview.options = {
          enableScripts: true,
        };
    
        webviewView.webview.html = getWebviewContent_pythonEnvSidebar();
        webviewView.webview.onDidReceiveMessage((message) => {
          if (message.command === "setup") {
           
            const envType: string = message.envType;
            const envName: string = message.envName;
            vscode.commands.executeCommand("nuedgewise.setupPythonEnv", envType, envName);
          
          }
        });
      },
    });  

    context.subscriptions.push(cloneRepos, setupPythonEnv, runVela,
         cloneReposSidebar, pythonEnvSetSidebar);
    context.subscriptions.push(
          vscode.window.registerWebviewViewProvider('velaTFLiteConversion', new TFLiteWebView(context))
      );     
}

function getWebviewContent_cloneSidebar() {
  const repos = github_repositories;

  const repoListItems = repos.map(repo => 
    `<li><input type="checkbox" value="${repo.url}" checked>${repo.name}</li>`
  ).join('');

  return `<!DOCTYPE html>
  <html>
  <head>
    <script>
      function cloneRepos() {
        const checkboxes = document.querySelectorAll("input[type='checkbox']:checked");
        const repos = Array.from(checkboxes).map(cb => cb.value);
        vscode.postMessage({ command: "clone", repos });
      }
    </script>
  </head>
  <body>
    <h3>Clone GitHub Repositories</h3>
    <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
      <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; width: 100%;">
        <input type="text" id="repoInput" placeholder="Enter repo URL and press Add" size="30">
      </div> 
      <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; width: 100%;">  
        <button onclick="addRepo()">Add</button>
      </div>
    </div>
    
    <h3>The Repositories List</h3>
    <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; width: 100%;">
      <ul id="repoList">
        ${repoListItems}
      </ul>
    </div>  
    <button onclick="cloneRepos()">Clone Selected</button>
  
    <script>
      const vscode = acquireVsCodeApi();
      
      function addRepo() {
        const repoInput = document.getElementById("repoInput");
        if (repoInput.value.trim()) {
          const ul = document.getElementById("repoList");
          const li = document.createElement("li");
          li.innerHTML = \`<input type="checkbox" value="\${repoInput.value}">\${repoInput.value}\`;
          ul.appendChild(li);
          repoInput.value = "";
        }
      }
    </script>
  </body>
  </html>`;
}

function getWebviewContent_pythonEnvSidebar() {

  return `<!DOCTYPE html>
  <html>
  <head>
    <script>
      function setupPython() {
        const envName = document.getElementById("envName").value || "env";
        const envType = document.getElementById("envType").value;
  
        vscode.postMessage({ command: "setup", envType, envName });
      }
    </script>
  </head>
  <body>
  
    <h3>Python Environment Setup</h3>
  
    <div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
      <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; width: 100%;"> 
      <label for="envName">Environment Name:</label>
        <input type="text" id="envName" placeholder="Enter environment name" value="NuEdgeWise_env" />
      </div> 
    
      <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; width: 100%;"> 
      <label for="envType">Environment Type:</label>
        <select id="envType">
          <option value="Conda">Conda</option>
          <option value="Virtualenv (venv)">Virtualenv (venv)</option>
        </select>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; width: 50%;">
        <button onclick="setupPython()">Setup Environment</button>
      </div>
    </div>
    
    
    <script>
      const vscode = acquireVsCodeApi();
    </script>
  </body>
  </html>`;
  
}

class TFLiteWebView implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
      this._context = context;
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
      this._view = webviewView;
      webviewView.webview.options = { enableScripts: true };
      webviewView.webview.html = this.getHtmlContent();

      webviewView.webview.onDidReceiveMessage(async message => {
          if (message.command === 'runExe') {
              await vscode.commands.executeCommand('nuedgewise.runVela', message.optimize, message.acc_cfg , message.sys_cfg);
          }
      });
  }

  private getHtmlContent(): string {
      return `
          <html>
          <body>
              <h3>Vela Runner</h3>
              <h4>Parameters Setting</h4>

              <div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
                <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; width: 100%;">
                <label>Optimize:</label>
                <select id="optimize">
                    <option value="Performance">Performance</option>
                    <option value="Size">Size</option>
                </select>
                </div>
  
                <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; width: 100%;">
                <label>Accelerator Config:</label>
                <select id="acc_cfg">
                    <option value="ethos-u55-256">ethos-u55-256</option>
                    <option value="ethos-u55-128">ethos-u55-128</option>
                </select>
                </div>
  
                <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; width: 100%;">
                <label>System Config:</label>
                <select id="sys_cfg">
                    <option value="Ethos_U55_High_End_Embedded">Ethos_U55_High_End_Embedded</option>
                </select>
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; width: 50%;">
                  <button onclick="runExe()">Run</button>
                </div>  
              </div>

              <script>
                  const vscode = acquireVsCodeApi();
                  function runExe() {
                      const optimize = document.getElementById("optimize").value;
                      const acc_cfg = document.getElementById("acc_cfg").value;
                      const sys_cfg = document.getElementById("sys_cfg").value;
                      vscode.postMessage({ command: "runExe", optimize, acc_cfg, sys_cfg });
                  }
              </script>
          </body>
          </html>
      `;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
