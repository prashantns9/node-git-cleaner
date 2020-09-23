#!/usr/bin/env node

/**
 * Prashant Shinde 
 * www.prashantshinde.in
 */

const exec = require('child_process').exec;
const inquirer = require('inquirer');

const readline = require("readline");

// configure input from console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// constants
const LIST_BRANCH_COMMAND = "git branch";
const DELETE_BRANCH_COMMAND = "git branch -d";

/**
 * Load local branches
 * @returns {Promise}
 */
function getBranchNames() {
    return new Promise((resolve, reject) => {
        console.log("\nLoading Branches...");
        exec(LIST_BRANCH_COMMAND, (err, stdout, stderr) => {
            if (stderr || err) {
                reject(stderr || err);
            } else {
                let branchNames = [];
                if (typeof (stdout) === "string" && stdout.length > 0) {
                    // transform output to branchNames array.
                    branchNames = stdout.replace("*", "").trim().split("\n").map(branchName => branchName.trim());
                }
                resolve(branchNames);
            }
        });
    });
};

/**
 * @param {Array} branchNames - Names of all available branches 
 * @returns {Promise} that resolves user menu choice.
 */
function showMenu(branchNames) {
    return new Promise((resolve, reject) => {
        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'branch',
                    message: 'Which branch do you want to delete?',
                    choices: [...branchNames, 'Quit'],
                }
            ])
            .then((answers) => {
                resolve(answers.branch)
            })
            .catch(err => reject(err));
    });
}

/**
 * @param {string} branchName - name of the branch you want to delete
 * @returns {Promise} 
 */
function deleteBranch(branchName) {
    return new Promise((resolve, reject) => {
        console.log("\nDeleting branch " + branchName);
        exec(`${DELETE_BRANCH_COMMAND} ${branchName}`, (err, stdout, stderr) => {
            if (stderr || err) {
                reject(stderr || err);
            } else {
                console.log(stdout);
                resolve();
            }
        });
    });
}

//driver function
async function main() {
    try {
        var branchNames = await getBranchNames();
        var choice = await showMenu(branchNames);

        while (choice && choice !== 'Quit') {
            // delete branch
            await deleteBranch(choice);
            // reload branches
            branchNames = await getBranchNames();
            choice = await showMenu(branchNames);
        };
    } catch (err) {
        console.log(err);
    } finally {
        process.exit();
    }
}

main();