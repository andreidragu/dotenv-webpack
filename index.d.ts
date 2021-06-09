import * as webpack from 'webpack';

declare class DotenvWebpackPlugin extends webpack.Plugin {
    /**
     *
     * @param options The config options.
     * @param customVars Custom webpack env variables. Define any other process.env variable here, instead of using webpack.DefinePlugin, in order to benefit from interpolation (dotenv expand).
     * @example customVars: {
     *    NODE_ENV: isProduction ? 'production' : 'development'
     * }
     */
    constructor (options?: DotenvWebpackPlugin.Options, customVars?: DotenvWebpackPlugin.CustomVars);
}

declare namespace DotenvWebpackPlugin {
    interface Options {
        /**
         * The path to your environment variables.
         * @default './.env'
         */
        path?: string;

        /**
         * If `false` ignore safe-mode, if `true` load `'./.env.example'`, if a `string` load that file as the sample.
         * @default false
         */
        safe?: boolean | string;

        /**
         * Whether to allow empty strings in safe mode.
         * If false, will throw an error if any env variables are empty (but only if safe mode is enabled).
         * @default false
         */
        allowEmptyValues?: boolean;

        /**
         * Set to `true` if you would rather load all system variables as well (useful for CI purposes).
         * @default false
         */
        systemvars?: boolean;

        /**
         * If `true`, all warnings will be suppressed.
         * @default false
         */
        silent?: boolean;

        /**
         * Allows your variables to be "expanded" for reusability within your .env file.
         * @default false
         */
        expand?: boolean;

        /**
         * Adds support for dotenv-defaults. If set to `true`, uses `./.env.defaults`. If a `string`, uses that location for a defaults file.
         * Read more at {@link https://www.npmjs.com/package/dotenv-defaults}.
         * @default false
         */
        defaults?: boolean | string;

        /**
         * Override the automatic check whether to stub `process.env`.
         * @default false
         */
         ignoreStub?: boolean;

        /**
         * If set to `true`, use variables from `defaults` to filter what can be available from `path` and `SYSTEM`.
         * Any other secret that is accessed from `path` or `SYSTEM` and is not present in `defaults` will be ignored.
         * If `defaults` false, then, no variable will be available.
         */
        extraSecure?: boolean;
    }

    interface CustomVars {
        [key: string]: string;
    }
}

export = DotenvWebpackPlugin;
