"use strict";
const vscode_languageserver_1 = require("vscode-languageserver");
const connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
let workspaceRoot;
connection.onInitialize((params) => {
    workspaceRoot = params.rootPath;
    console.log('initialization result.');
    return {
        capabilities: {}
    };
});
connection.listen();
//# sourceMappingURL=TypeScriptHeroServer.js.map