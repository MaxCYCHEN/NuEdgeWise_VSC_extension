# NuEdgeWise README

This is the VSCode extension to help you prepare the [NuEdgeWise](https://github.com/OpenNuvoton/NuEdgeWise) automatically.

## Features

- `NuEdgeWise: Clone Multiple Repositories`: Help you download all tools and example applications in [NuEdgeWise](https://github.com/OpenNuvoton/NuEdgeWise)
- `NuEdgeWise: Set Up Python Environment`: Help you setup NuEdgeWise python ENV.
- `NuEdgeWise: Run Vela TFLite Conversion`: Support vela compiler to convert TFLite int8 model to vela TFLite.

## Requirements

- Need to install [git](https://git-scm.com/downloads) and miniconda(About conda, we recommand to use [Miniforge](https://github.com/conda-forge/miniforge))
- Users need to first clone the NuEdgeWise repository from the CLONE REPOS tab, and then setup the NuEdgeWise_env Python environment from the PYTHON ENVIRONMENT SETUP tab.

## Extension Settings
- If you use a different path for your NuEdgeWise directory
    - Command Palette (Ctrl + shift + P) → Preferences: Open Settings (UI) → Search for `NuEdgeWise Python Env Setup` → set the `Default NuEdgeWise Path` to yours

- If you have changed your Conda installation path from the default, please make sure to update it accordingly.
    - Command Palette (Ctrl + shift + P) → Preferences: Open Settings (UI) → Search for `NuEdgeWise Python Env Setup` → set the `Adding Conda Bin Path` to yours


## Known Issues


## Release Notes

### 0.0.4

- Add more default condabin paths
- Remove some vela configs

### 0.0.3

- Update NuEdgeWise install path and Conda bin path basing on default config
- Change to Nuvoton publisher


