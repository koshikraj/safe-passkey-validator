# Safe Passkey Validator

[![License](https://img.shields.io/badge/license-GPL3-blue.svg)](https://github.com/koshikraj/safe-passkey-validator/blob/main/LICENSE)

## Description

Safe Passkey Validator is a passkey validation module for Safe accounts. It utilizes ZerdoDev's WebAuthn validator module and Rhinestone's Safe 7579 adapter.


## Features

- Validates passkeys for Safe accounts
- Integrates with [ZerdoDev's WebAuthn validator](https://github.com/zerodevapp/kernel-7579-plugins/tree/master/validators/webauthn) module
- Utilizes Rhinestone's [Safe 7579 adapter](https://github.com/rhinestonewtf/safe7579)

## Usage

1. Clone the repository:

    ```bash
    git clone https://github.com/koshikraj/safe-passkey-validator.git
    ```

2. Project structure:

├── safe-passkey-validator <br/>
│   ├── [Safe App](./web)<br/>
│   ├── [WebAuthn Module](./module)<br/>
│   └── [Dependency Packages](./packages)



## Contributing

Contributions are welcome! Please follow the [contribution guidelines](CONTRIBUTING.md) to contribute to this project.

## License

This project is licensed under the [GPL-3.0 license](./LICENSE).