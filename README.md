# AWSome IoT Prototyping Day for INTTRA

Today we will build a completely functional, end-to-end IoT prototype of an asset tracking system using the **ESP32 HiLetGo** development board ([Find it on Amazon](https://www.amazon.com/HiLetgo%C2%AE-ESP-WROOM-32-Development-Microcontroller-Integrated/dp/B0718T232Z)).

![ESP32 HiLetGo](img/esp32-hiletgo.jpg) 

. Here are some specs:
- Hybrid Wifi/Bluetooth Chip. ESP32 can interface with other systems to provide Wi-Fi and Bluetooth functionality through its SPI / SDIO or I2C / UART interfaces.
- Built-in antenna switches, RF balun, power amplifier, low-noise receive amplifier, filters, and power management.
- ESP32 achieves ultra-low power consumption with a combination of several types of proprietary software
- ESP32 is capable of functioning reliably in industrial environments, with an operating temperature ranging from –40°C to +125°C. 

We will use **AWS** to collect, store and visualize the data from the devices. The map-based dashboard will listen for state changes to the device shadow and update in near real time. Secondly, all transactions will be stored in a blockchain ledger, to provide users a definitive, unalterable history of transactions. This means, they will be able to confirm with certainty the path their shipment took (GPS Sensors), that the shipment was not tampered with (light and motion sensors) and it met environmental requirements (temperature and humidity sensors). The centralized blockchain solution we will use is **Hyperledger Sawtooth on AWS**.

## Pre-requisites 

### AWS Environment

Before getting started, make sure you have access to an AWS account and have the AWS CLI installed on your development machine. 

- Simple AWS CLI installation with PIP: `pip install awscli --upgrade --user`
- Windows installers: [64bit](https://s3.amazonaws.com/aws-cli/AWSCLI64.msi) | [32bit](https://s3.amazonaws.com/aws-cli/AWSCLI32.msi)

Complete guide to installing the CLI: [https://docs.aws.amazon.com/cli/latest/userguide/installing.html](https://docs.aws.amazon.com/cli/latest/userguide/installing.html)

#### Configure the AWS CLI

- Create a new IAM user with the following permissions ([OPTIONAL: For more details click here](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html))
- Attach the following policies to the IAM user: **AWSIoTFullAccess**.
- Create a set of credentials and download the credentials. 
- Run `aws configure --profile proto` to create a new profile called 'proto'.
- Put in your credentials and set the region to us-east-1 and the output format to json.

```
:~ user$ aws configure --profile proto
AWS Access Key ID [None]: AFDFDFGKGLGLSKFK
AWS Secret Access Key [None]: f0f0dfkkfKFAf032ask32
Default region name [None]: us-east-1
Default output format [None]: json
```

### IoT Development Environment

#### Mongoose Tool Chain

- Install the Mongoose OS (MOS) toolchain: [OPTIONAL: For more details, click here](https://mongoose-os.com/software.html)
    - Windows: [Download (.exe)](https://mongoose-os.com/downloads/mos-release/win/mos.exe)
    - Mac:
        ```
       curl -fsSL https://mongoose-os.com/downloads/mos/install.sh | /bin/bash
        ~/.mos/bin/mos --help      
        ```
- Download SILabs Driver for ESP32: [OPTIONAL: For more details, click here](https://www.silabs.com/products/development-tools/software/usb-to-uart-bridge-vcp-drivers)
   - Windows: [Win10 Universal Download](https://www.silabs.com/documents/public/software/CP210x_Universal_Windows_Driver.zip), [Win7-10 Download](https://www.silabs.com/documents/public/software/CP210x_Windows_Drivers.zip)
   - Mac: [Download (.zip)](https://www.silabs.com/documents/public/software/Mac_OSX_VCP_Driver.zip)
  
Now, let's start the Mongoose development environment in your browser:
```
 ~/.mos/bin/mos
```

## Device Setup

In this section, we will provision the device with certificates to connect to AWS