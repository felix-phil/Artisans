const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { exec } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const promptQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};
const writeFilePromise = (path: string, content: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, content, (error: any) => {
      if (error) {
        reject(error);
      }
      resolve(true);
    });
  });
};
const writePackageJson = async (path: string, serviceName: string) => {
  const content = `{
    "name": "${serviceName}",
    "version": "1.0.0",
    "main": "index.ts",
    "license": "MIT",
    "scripts": {
      "start": "ts-node-dev src/index.ts",
      "test": "jest --watchAll --no-cache",
      "test:ci": "jest"
    },
    "jest": {
      "preset": "ts-jest",
      "testEnvironment": "node",
      "setupFilesAfterEnv": [
        "./src/test/setup.ts"
      ]
    },
    "dependencies": {
      "@theartisans/shared": "^1.0.19",
      "@types/cookie-session": "^2.0.44",
      "@types/express": "^4.17.13",
      "@types/jsonwebtoken": "^8.5.8",
      "cookie-session": "^2.0.0",
      "express": "^4.18.1",
      "express-async-errors": "^3.1.1",
      "express-validator": "^6.14.0",
      "flutterwave-node-v3": "^1.0.9",
      "jsonwebtoken": "^8.5.1",
      "mongoose": "^6.3.1",
      "mongoose-update-if-current": "^1.4.0",
      "node-nats-streaming": "^0.3.2",
      "ts-node-dev": "^1.1.8",
      "typescript": "^4.6.4"
    },
    "devDependencies": {
      "@types/jest": "^27.4.1",
      "@types/supertest": "^2.0.12",
      "jest": "^27.4.1",
      "mongodb-memory-server": "^7.5.1",
      "supertest": "^6.2.3",
      "ts-jest": "27.1.4"
    }
  }
  `;
  await writeFilePromise(path, content);
};
const writeIndexJs = async (path: string, serviceName: string) => {
  const content = `
  import mongoose from 'mongoose';

import { app } from './app';
import { natsWrapper } from './nats-wrapper';
import { paymentWrapper } from './payment-wrapper';

const PORT: number = 3000;

const start = async () => {
  console.log('Starting up......');

  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY env variable must be defined');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI env variable must be defined');
  }
  if (!process.env.NATS_CLIENT_ID) {
    throw new Error('NATS_CLIENT_ID env variable must be defined');
  }
  if (!process.env.NATS_URL) {
    throw new Error('NATS_URL env variable must be defined');
  }
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error('NATS_CLUSTER_ID env variable must be defined');
  }
  if (!process.env.FLUTTERWAVE_PUBLIC) {
    throw new Error('FLUTTERWAVE_PUBLIC env variable must be defined');
  }
  if (!process.env.FLUTTERWAVE_SECRET) {
    throw new Error('FLUTTERWAVE_SECRET env variable must be defined');
  }
  if (!process.env.FLUTTERWAVE_ENCKEY) {
    throw new Error('FLUTTERWAVE_ENCKEY env variable must be defined');
  }
  if (!process.env.REDIS_HOST) {
    throw new Error('REDIS_HOST env variable must be defined');
  }
  try {
    // NATS streaming server initialization

    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );
    natsWrapper.client.on('close', () => {
      console.log('NATS connection closed!');
      process.exit();
    });
    // Closing NAT server on pod closed
    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());

    
    // MongoDB initialization
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Billing DB Connected');
  } catch (error) {
    console.error(error);
  }
  app.listen(PORT, (): void => {
    console.log('${serviceName} listening on port ' + PORT);
  });
};

start();
  `;
  await writeFilePromise(path, content);
};
const writeAppJs = async (path: string) => {
  const content = `
  import express from "express";
import "express-async-errors";
import { json, urlencoded } from "body-parser";
import cookieSesion from "cookie-session";

import {
  errorHandler,
  NotFoundError,
  currentUser,
} from "@theartisans/shared/build";

const app = express();
app.set("trust proxy", true);
app.use(urlencoded({ extended: true }));
app.use(json());
app.use(
  cookieSesion({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(currentUser);

app.all("*", async (req, res, next) => {
  throw new NotFoundError();
});
app.use(errorHandler);

export { app };

  `;
  await writeFilePromise(path, content);
};
const writeInitialTest = async (path: string) => {
  const content = `
  import { MongoMemoryServer } from "mongodb-memory-server";
  import mongoose from "mongoose";
  import jwt from "jsonwebtoken";
  import { UserRoles, SubscriptionType } from "@theartisans/shared/build";
  import { paymentWrapper } from "../payment-wrapper";
  
  jest.mock("../nats-wrapper");
  
  let mongod: any;
  
  declare global {
    var signin: (superUser?: boolean, userId?: string) => string[];
  }
  
  beforeAll(async () => {
    process.env.JWT_KEY = "testingKey";
  
    
  
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
  });
  
  beforeEach(async () => {
    jest.clearAllMocks();
    const collections = await mongoose.connection.db.collections();
  
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
  });
  
  global.signin = (superUser = true, userId?: string): string[] => {
    // Build a JWT payload. {id, email}
    const id = userId || new mongoose.Types.ObjectId().toHexString();
  
    const payload = {
      id: id,
      email: "devfelixphil@gmail.com",
      roles: superUser ? Object.values(UserRoles) : [UserRoles.Normal],
      firstName: "Felix",
      lastName: "Philips",
      active: true,
      banned: false,
      subscription: {
        subscriptionType: SubscriptionType.PREMIUM,
        id: new mongoose.Types.ObjectId().toHexString(),
      },
      mobileNumber: "",
      loginCount: 2,
      lastLogin: new Date(),
      profileImageUrl: "",
    };
    // Create a JWT
    const token = jwt.sign(payload, process.env.JWT_KEY!, { expiresIn: "2h" });
  
    // Build session Object. {jwt: myjwtklsd...}
    const session = { jwt: token };
  
    // Turn that session into JSON
    const sessionJSON = JSON.stringify(session);
  
    // encode the JSON as base64
    const base64EncodededJson = Buffer.from(sessionJSON).toString("base64");
  
    // return a cookie string with encoded data
    return [\`session=\${base64EncodededJson}\`];
  };
  `;
  await writeFilePromise(path, content);
};
const writeTsConfig = async (path: string) => {
  const content = `
  {
    "ts-node": {
      "files": true
    },
    "compilerOptions": {
      /* Visit https://aka.ms/tsconfig.json to read more about this file */
  
      /* Projects */
      // "incremental": true,                              /* Enable incremental compilation */
      // "composite": true,                                /* Enable constraints that allow a TypeScript project to be used with project references. */
      // "tsBuildInfoFile": "./",                          /* Specify the folder for .tsbuildinfo incremental compilation files. */
      // "disableSourceOfProjectReferenceRedirect": true,  /* Disable preferring source files instead of declaration files when referencing composite projects */
      // "disableSolutionSearching": true,                 /* Opt a project out of multi-project reference checking when editing. */
      // "disableReferencedProjectLoad": true,             /* Reduce the number of projects loaded automatically by TypeScript. */
  
      /* Language and Environment */
      "target": "es2016" /* Set the JavaScript language version for emitted JavaScript and include compatible library declarations. */,
      // "lib": [],                                        /* Specify a set of bundled library declaration files that describe the target runtime environment. */
      // "jsx": "preserve",                                /* Specify what JSX code is generated. */
      // "experimentalDecorators": true,                   /* Enable experimental support for TC39 stage 2 draft decorators. */
      // "emitDecoratorMetadata": true,                    /* Emit design-type metadata for decorated declarations in source files. */
      // "jsxFactory": "",                                 /* Specify the JSX factory function used when targeting React JSX emit, e.g. 'React.createElement' or 'h' */
      // "jsxFragmentFactory": "",                         /* Specify the JSX Fragment reference used for fragments when targeting React JSX emit e.g. 'React.Fragment' or 'Fragment'. */
      // "jsxImportSource": "",                            /* Specify module specifier used to import the JSX factory functions when using \`jsx: react-jsx*\`.\` */
      // "reactNamespace": "",                             /* Specify the object invoked for \`createElement\`. This only applies when targeting \`react\` JSX emit. */
      // "noLib": true,                                    /* Disable including any library files, including the default lib.d.ts. */
      // "useDefineForClassFields": true,                  /* Emit ECMAScript-standard-compliant class fields. */
  
      /* Modules */
      "module": "commonjs" /* Specify what module code is generated. */,
      // "rootDir": "./",                                  /* Specify the root folder within your source files. */
      // "moduleResolution": "node",                       /* Specify how TypeScript looks up a file from a given module specifier. */
      // "baseUrl": "./",                                  /* Specify the base directory to resolve non-relative module names. */
      // "paths": {},                                      /* Specify a set of entries that re-map imports to additional lookup locations. */
      // "rootDirs": [],                                   /* Allow multiple folders to be treated as one when resolving modules. */
      // "typeRoots": [],                                  /* Specify multiple folders that act like \`./node_modules/@types\`. */
      // "types": [],                                      /* Specify type package names to be included without being referenced in a source file. */
      // "allowUmdGlobalAccess": true,                     /* Allow accessing UMD globals from modules. */
      // "resolveJsonModule": true,                        /* Enable importing .json files */
      // "noResolve": true,                                /* Disallow \`import\`s, \`require\`s or \`<reference>\`s from expanding the number of files TypeScript should add to a project. */
  
      /* JavaScript Support */
      // "allowJs": true,                                  /* Allow JavaScript files to be a part of your program. Use the \`checkJS\` option to get errors from these files. */
      // "checkJs": true,                                  /* Enable error reporting in type-checked JavaScript files. */
      // "maxNodeModuleJsDepth": 1,                        /* Specify the maximum folder depth used for checking JavaScript files from \`node_modules\`. Only applicable with \`allowJs\`. */
  
      /* Emit */
      // "declaration": true,                              /* Generate .d.ts files from TypeScript and JavaScript files in your project. */
      // "declarationMap": true,                           /* Create sourcemaps for d.ts files. */
      // "emitDeclarationOnly": true,                      /* Only output d.ts files and not JavaScript files. */
      // "sourceMap": true,                                /* Create source map files for emitted JavaScript files. */
      // "outFile": "./",                                  /* Specify a file that bundles all outputs into one JavaScript file. If \`declaration\` is true, also designates a file that bundles all .d.ts output. */
      // "outDir": "./",                                   /* Specify an output folder for all emitted files. */
      // "removeComments": true,                           /* Disable emitting comments. */
      // "noEmit": true,                                   /* Disable emitting files from a compilation. */
      // "importHelpers": true,                            /* Allow importing helper functions from tslib once per project, instead of including them per-file. */
      // "importsNotUsedAsValues": "remove",               /* Specify emit/checking behavior for imports that are only used for types */
      // "downlevelIteration": true,                       /* Emit more compliant, but verbose and less performant JavaScript for iteration. */
      // "sourceRoot": "",                                 /* Specify the root path for debuggers to find the reference source code. */
      // "mapRoot": "",                                    /* Specify the location where debugger should locate map files instead of generated locations. */
      // "inlineSourceMap": true,                          /* Include sourcemap files inside the emitted JavaScript. */
      // "inlineSources": true,                            /* Include source code in the sourcemaps inside the emitted JavaScript. */
      // "emitBOM": true,                                  /* Emit a UTF-8 Byte Order Mark (BOM) in the beginning of output files. */
      // "newLine": "crlf",                                /* Set the newline character for emitting files. */
      // "stripInternal": true,                            /* Disable emitting declarations that have \`@internal\` in their JSDoc comments. */
      // "noEmitHelpers": true,                            /* Disable generating custom helper functions like \`__extends\` in compiled output. */
      // "noEmitOnError": true,                            /* Disable emitting files if any type checking errors are reported. */
      // "preserveConstEnums": true,                       /* Disable erasing \`const enum\` declarations in generated code. */
      // "declarationDir": "./",                           /* Specify the output directory for generated declaration files. */
      // "preserveValueImports": true,                     /* Preserve unused imported values in the JavaScript output that would otherwise be removed. */
  
      /* Interop Constraints */
      // "isolatedModules": true,                          /* Ensure that each file can be safely transpiled without relying on other imports. */
      // "allowSyntheticDefaultImports": true,             /* Allow 'import x from y' when a module doesn't have a default export. */
      "esModuleInterop": true /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables \`allowSyntheticDefaultImports\` for type compatibility. */,
      // "preserveSymlinks": true,                         /* Disable resolving symlinks to their realpath. This correlates to the same flag in node. */
      "forceConsistentCasingInFileNames": true /* Ensure that casing is correct in imports. */,
  
      /* Type Checking */
      "strict": true /* Enable all strict type-checking options. */,
      // "noImplicitAny": true,                            /* Enable error reporting for expressions and declarations with an implied \`any\` type.. */
      // "strictNullChecks": true,                         /* When type checking, take into account \`null\` and \`undefined\`. */
      // "strictFunctionTypes": true,                      /* When assigning functions, check to ensure parameters and the return values are subtype-compatible. */
      // "strictBindCallApply": true,                      /* Check that the arguments for \`bind\`, \`call\`, and \`apply\` methods match the original function. */
      // "strictPropertyInitialization": true,             /* Check for class properties that are declared but not set in the constructor. */
      // "noImplicitThis": true,                           /* Enable error reporting when \`this\` is given the type \`any\`. */
      // "useUnknownInCatchVariables": true,               /* Type catch clause variables as 'unknown' instead of 'any'. */
      // "alwaysStrict": true,                             /* Ensure 'use strict' is always emitted. */
      // "noUnusedLocals": true,                           /* Enable error reporting when a local variables aren't read. */
      // "noUnusedParameters": true,                       /* Raise an error when a function parameter isn't read */
      // "exactOptionalPropertyTypes": true,               /* Interpret optional property types as written, rather than adding 'undefined'. */
      // "noImplicitReturns": true,                        /* Enable error reporting for codepaths that do not explicitly return in a function. */
      // "noFallthroughCasesInSwitch": true,               /* Enable error reporting for fallthrough cases in switch statements. */
      // "noUncheckedIndexedAccess": true,                 /* Include 'undefined' in index signature results */
      // "noImplicitOverride": true,                       /* Ensure overriding members in derived classes are marked with an override modifier. */
      // "noPropertyAccessFromIndexSignature": true,       /* Enforces using indexed accessors for keys declared using an indexed type */
      // "allowUnusedLabels": true,                        /* Disable error reporting for unused labels. */
      // "allowUnreachableCode": true,                     /* Disable error reporting for unreachable code. */
  
      /* Completeness */
      // "skipDefaultLibCheck": true,                      /* Skip type checking .d.ts files that are included with TypeScript. */
      "skipLibCheck": true /* Skip type checking all .d.ts files. */
    }
  }
  
  `;
  await writeFilePromise(path, content);
};
const writeDocker = async (path: string, pathIgnore: string) => {
  const content1 = `
FROM node:alpine

WORKDIR /app
COPY package.json .
RUN yarn install --production=true
COPY . .

CMD ["yarn", "start"]
  `;
  const content2 = `
  node_modules
  `;
  await writeFilePromise(path, content1);
  await writeFilePromise(pathIgnore, content2);
};

const createService = async () => {
  const serviceName = await promptQuestion("What is the service name?");
  const modelFolder = (await promptQuestion("Do you want a model folder? y/N"))
    .toLowerCase()
    .startsWith("y")
    ? true
    : false;
  const routeFolder = (await promptQuestion("Do you want a routes folder? y/N"))
    .toLowerCase()
    .startsWith("y")
    ? true
    : false;
  const expressAppFile = (
    await promptQuestion("Do you want a express app file? y/N")
  )
    .toLowerCase()
    .startsWith("y")
    ? true
    : false;

  if (fs.existsSync(serviceName)) {
    throw new Error("Service with this name already exists!");
  }
  let fd: any;
  fs.mkdirSync(serviceName, { mode: 0o777 });

  const sourcePath = serviceName + "/src";
  fs.mkdirSync(sourcePath);

  if (modelFolder) fs.mkdirSync(sourcePath + "/model");
  if (routeFolder) fs.mkdirSync(sourcePath + "/routes");
  fs.mkdirSync(sourcePath + "/test");
  if (expressAppFile) await writeAppJs(sourcePath + "/app.ts");
  await writeIndexJs(sourcePath + "/index.ts", serviceName);
  await writeInitialTest(sourcePath + "/test/setup.ts");
  await writeDocker(
    serviceName + "/Dockerfile",
    serviceName + "/.dockerignore"
  );
  await writeTsConfig(serviceName + "/tsconfig.json");
  await writePackageJson(serviceName + "/package.json", serviceName);

  exec(
    `cd ${serviceName} && yarn install`,
    (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );
  console.log("Done");
  // process.exit();
};
createService();
