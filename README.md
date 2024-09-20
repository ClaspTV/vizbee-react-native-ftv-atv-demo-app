# vizbee-react-native-ftv-atv-demo-app

This README provides instructions on how to set up and run the vizbee-react-native-ftv-atv-demo-app.

## Getting Started

Follow these steps to get the app running on your local machine.

### 1. Clone the Repository

Clone the repository using one of the following commands:

```bash
# Using SSH
git clone git@github.com:ClaspTV/vizbee-react-native-ftv-atv-demo-app.git

# OR using HTTPS
git clone https://github.com/ClaspTV/vizbee-react-native-ftv-atv-demo-app.git
```

### 2. Install Dependencies

After cloning the repository, navigate to the project directory and install the necessary dependencies:

```bash
cd vizbee-react-native-ftv-atv-demo-app
# using npm
npm install

# OR using Yarn
yarn install
```

### 3. Start the Metro Server

Next, you need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

### 4. Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _AndroidTV_ or _FireTV_ app:

### For Android TV

```bash
# using npm
npm run android-tv

# OR using Yarn
yarn android-tv
```

### For Fire TV

```bash
# using npm
npm run fire-tv

# OR using Yarn
yarn fire-tv
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ shortly provided you have set up your emulator correctly.

This is one way to run your app — you can also run it directly on your connected Android and Fire TV devices
