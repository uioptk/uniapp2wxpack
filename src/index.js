#!/usr/bin/env node

(function(){
    const path = require('path')
    const { program } = require('commander')
    const { spawn, spawnSync } = require('child_process')
    program
        .option('--create', '创建模板')
        .option('--build <type>', 'build')
        .option('--plugin', '插件模式')
        .option('--type <type>', '解耦包类型(哪种小程序)', 'weixin')
        .option('--native', '原生模式')

    program.parse(process.argv);


    if (program.create) {
        const fs = require('fs-extra')
        const targetPath = process.cwd()
        const targetPackageJson = require(path.resolve(targetPath, 'package.json'))
        const templatePackageJson = require('./template/package.json')
        const projectToSubPackageConfig = require('./template/projectToSubPackageConfig')
        targetPackageJson.scripts = {...templatePackageJson.scripts, ...targetPackageJson.scripts || {}}
        targetPackageJson.dependencies = {...templatePackageJson.dependencies, ...targetPackageJson.dependencies||{}}
        fs.copySync(path.resolve(__dirname, 'template/projectToSubPackageConfig.js'), path.resolve(targetPath, 'projectToSubPackageConfig.js'))
        console.log('projectToSubPackageConfig植入成功')
        fs.writeJsonSync(path.resolve(targetPath,'package.json'), targetPackageJson,{ spaces: 2 })
        console.log('package.json更新成功')
        if (projectToSubPackageConfig.mainWeixinMpPath) {
            fs.mkdirsSync(path.resolve(targetPath,projectToSubPackageConfig.mainWeixinMpPath))
            console.log('projectToSubPackageConfig.mainWeixinMpPath创建成功')
        }
        if (projectToSubPackageConfig.mainToutiaoMpPath) {
            fs.mkdirsSync(path.resolve(targetPath,projectToSubPackageConfig.mainToutiaoMpPath))
            console.log('projectToSubPackageConfig.mainToutiaoMpPath创建成功')
        }

        // 使用同步进程
        const workerProcess = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', 'concurrently', 'cross-env', 'uniapp2wxpack', '-S'],{
            cwd: process.cwd(),
            stdio: 'inherit'
        })
        return
    }

    let commandType = {
        development: 'startToPackServe',
        production: 'mpWxSubMode'
    }
    if (commandType[program.build]) {
        spawn(process.execPath, [
            require.resolve('gulp/bin/gulp.js'),
            commandType[program.build],
            '--scope', process.cwd(),
            ...(program.plugin ? ['--plugin'] : []),
            ...(program.native ? ['--native'] : []),
            '--type', program.type
        ], {
            cwd: __dirname,
            stdio: 'inherit'
        });
        return
    }

    console.log("缺少参数\n--create\n--build [development/production]")
})();
