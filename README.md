# dotenv-webpack

A secure webpack plugin that supports dotenv and other environment variables and **only exposes what you choose and use**.

## Installation

Include the package locally in your repository.

`npm install @andreidragu/dotenv-webpack --save-dev`
<br>
or
<br>
`yarn add -D @andreidragu/dotenv-webpack`

## Description

`@andreidragu/dotenv-webpack` wraps `dotenv` and `Webpack.DefinePlugin`. As such, it does a text replace in the resulting bundle for any instances of `process.env`.

Your `.env` files can include sensitive information. Because of this,`@andreidragu/dotenv-webpack` will only expose environment variables that are **explicitly referenced in your code** to your final bundle.

### What is different in this fork?

#### There are 2 major differences

* **customVars** - added as a second optional parameter, beside `options`, in order to take advantage of value interpolation for values that are defined in webpack config file.

##### Example

###### .env file

```javascript
NODE_ENV=local
NODE_EXPAND=${NODE_ENV}_expanded
```

###### webpack.config.js file with webpack.DefinePlugin

```javascript
const Dotenv = require('@andreidragu/dotenv-webpack');

module.exports = {
  ...
  plugins: [
    new webpack.DefinePlugin(
      {
        'process.env.NODE_ENV': JSON.stringify('development')
      }
    ),
    new Dotenv(
      {
        expand: true
      }
    )
  ]
  ...
};
```

###### In your code

```javascript
// file1.js
console.log(process.env.NODE_ENV); // 'development'
console.log(process.env.NODE_EXPAND); // 'local_expanded' - wrong, it should be development_expanded
```

###### Resulting bundle

```javascript
// bundle.js
console.log('development');
console.log('local_expanded'); // wrong, it should be development_expanded
```

_**This happens because at the time `Dotenv` plugin is executed, the other variable is no yet present. Changing order will not fix the issue - `Dotenv` plugin will override webpack variable, again not a desirable outcome**_

##### Solution

Move any other webpack variables inside Dotenv second parameter:

###### webpack.config.js file without ~~webpack.DefinePlugin~~

```javascript
const Dotenv = require('@andreidragu/dotenv-webpack');

module.exports = {
  ...
  plugins: [
    new Dotenv(
      {
        expand: true
      },
      {
        'NODE_ENV': 'development'
      }
    )
  ]
  ...
};
```

###### In your code

```javascript
// file1.js
console.log(process.env.NODE_ENV); // 'development'
console.log(process.env.NODE_EXPAND); // 'development_expanded'
```

###### Resulting bundle

```javascript
// bundle.js
console.log('development');
console.log('development_expanded'); // exactly what we wanted
```

* **extraSecure** - If set to `true`, use variables from `defaults` to filter what can be available from `path` and `SYSTEM`.<br>
Any other secret that is accessed from `path` or `SYSTEM` and is not present in `defaults` will be ignored.

***Note:*** If `extraSecure` is **true** and `defaults` is **false**, then, no variable will be available.

##### Use case

We have an inherited .env file that contains a lot of secrets but also variables that are useful for front end (like REST_API_URL) and another custom .env file that contains only entries that are relevant for front end side. Note that if the build is run from a server (QA or LIVE), that server also have SYSTEM variables that may contain secrets.
<br>
I don't want to have the liberty to access any secret from .env file (`process.env.SECRET`)

##### Solution

Put `extraSecure` toggle on `true` and add in `defaults` .env file all the variables that you want to be accessible in frontend.

##### Example

###### ./../backend/.env or other root .env file

```dosini
DB_HOST=127.0.0.1
DB_PASS=foobar
S3_API=mysecretkey
REST_API_URL=https://example.com/api
```

###### .env.frontend - frontend specific

add here all the variables that you want to be accessible in front end + any other specific ones

```dosini
# ALLOWED VARIABLES FROM SYSTEM
HOME=

# ALLOWED VARIABLES FROM BACKEND
REST_API_URL=default
DB_HOST=

# OTHER VARIABLE THAT DON'T EXIST ANYWHERE
OTHER_VAR=

# FRONTEND SPECIFIC VARIABLES
BUILD_ENV=local
```

values for `REST_API_URL` and `DB_HOST` can be anything, even empty string `DB_HOST=`, if you omit `=`, the variable will not be valid.

###### webpack.config.js

```javascript
const Dotenv = require('@andreidragu/dotenv-webpack');

module.exports = {
  ...
  plugins: [
    new Dotenv(
      {
        path: './../backend/.env',
        systemvars: true,
        expand: true,
        defaults: './.env.frontend',
        extraSecure: true
      },
      {
        'NODE_ENV': 'production'
      }
    )
  ]
  ...
};
```

###### In your code

```javascript
// file1.js
console.log(process.env.HOME); // allowed SYSTEM variable
console.log(process.env.PATH); // NOT allowed SYSTEM variable

console.log(process.env.REST_API_URL); // allowed backend variable
console.log(process.env.DB_HOST); // allowed backend variable
console.log(process.env.S3_API); // NOT allowed backend variable

console.log(process.env.OTHER_VAR); // allowed variable that don't exist anywhere else

console.log(process.env.BUILD_ENV); // custom front end variable
console.log(process.env.NODE_ENV); // webpack variable
```

###### Resulting bundle

```javascript
// bundle.js
console.log('/c/Users/username');
console.log(process.env.PATH); // undefined

console.log('https://example.com/api');
console.log('127.0.0.1');
console.log(process.env.S3_API); // undefined

console.log(''); // empty string

console.log('local');
console.log('production');
```

## Usage

The plugin can be installed with little-to-no configuration needed. Once installed, you can access the variables within your code using `process.env` as you would with `dotenv`.

The example bellow shows a standard use-case.

### Create a .env file

```dosini
# .env
DB_HOST=127.0.0.1
DB_PASS=foobar
S3_API=mysecretkey

```

### Add it to your Webpack config file

```javascript
// webpack.config.js
const Dotenv = require('@andreidragu/dotenv-webpack');

module.exports = {
  ...
  plugins: [
    new Dotenv()
  ]
  ...
};
```

### Use in your code

```javascript
// file1.js
console.log(process.env.DB_HOST);
// '127.0.0.1'
```

### Resulting bundle

```javascript
// bundle.js
console.log('127.0.0.1');
```

Note: the `.env` values for `DB_PASS` and  `S3_API` are **NOT** present in our bundle, as they were never referenced (as `process.env.[VAR_NAME]`) in the code.

## How Secure?

By allowing you to define exactly where you are loading environment variables from and bundling only variables in your project that are explicitly referenced in your code, you can be sure that only what you need is included and you do not accidentally leak anything sensitive.

**As an extra security step you can enable `extraSecure` toggle in order to use variables from `defaults` to filter what can be available from `path` and `SYSTEM`**

###### Recommended

Add `.env` to your `.gitignore` file

## Limitations

Due to the fact that we use `webpack.DefinePlugin` under the hood, we cannot support destructing as that breaks how this plugin is meant to be used. Because of this, please reference your variables without destructing. For more information about this, please review the issue [here](https://github.com/mrsteele/dotenv-webpack/issues/70).

## `process.env` stubbing / replacing

`process.env` is not polyfilled in Webpack 5+, leading to errors in environments where `process` is `null` (browsers).

We automatically replace any remaining `process.env`s in these environments with `"MISSING_ENV_VAR"` to avoid these errors.

If you are running into issues where you or another package you use interfaces with `process.env`, it might be best to set `ignoreStub: true` and make sure you always reference variables that exist within your code (See [this issue](https://github.com/mrsteele/dotenv-webpack/issues/271) for more information).

## Properties

Use the following properties to configure your instance.

* **path** (`'./.env'`) - The path to your environment variables.
* **safe** (`false`) - If `true`, load '.env.example' to verify the '.env' variables are all set. Can also be a string to a different file.
* **allowEmptyValues** (`false`) - Whether to allow empty strings in safe mode. If `false`, will throw an error if any env variables are empty (but only if safe mode is enabled).
* **systemvars** (`false`) - Set to `true` if you would rather load all system variables as well (useful for CI purposes).
* **silent** (`false`) - If `true`, all warnings will be suppressed.
* **expand** (`false`) - Allows your variables to be "expanded" for reusability within your `.env` file.
* **defaults** (`false`) - Adds support for `dotenv-defaults`. If set to `true`, uses `./.env.defaults`. If a string, uses that location for a defaults file. Read more at [npm](https://www.npmjs.com/package/dotenv-defaults).
* **ignoreStub** (`false`) - Override the automatic check whether to stub `process.env`. [Read more here](#user-content-processenv-stubbing--replacing).
* **extraSecure**(`false`) - If set to `true`, use variables from `defaults` to filter what can be available from `path` and `SYSTEM`. Any other secret that is accessed from `path` or `SYSTEM` and is not present in `defaults` will be ignored.If `defaults` false, then, no variable will be available.

Use the second parameter to define other 'process.env' variables from your **webpack.config** file, instead of using `webpack.DefinePlugin`, in order to benefit from interpolation (dotenv expand).

```javascript
{
  'NODE_ENV': 'development'
}

The following example shows how to set any/all arguments.

```javascript
module.exports = {
  ...
  plugins: [
    new Dotenv(
      {
        path: './some.other.env', // load this now instead of the ones in '.env'
        safe: true, // load '.env.example' to verify the '.env' variables are all set. Can also be a string to a different file
        allowEmptyValues: true, // allow empty variables (e.g. `FOO=`) (treat it as empty string, rather than missing)
        systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs
        silent: true, // hide any errors
        expand: true, // Allows your variables to be "expanded" for reusability
        defaults: true, // load '.env.defaults' as the default values if empty
        extraSecure: true // use variables from `defaults` to filter what can be available when access 'process.env' from `path` or SYSTEM
      },
      {
        'NODE_ENV': isProduction ? 'production' : 'development'
      }
    )
  ]
  ...
};
```

## LICENSE

MIT
