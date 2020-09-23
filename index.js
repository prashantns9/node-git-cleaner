#!/usr/bin/env node

/**
 * Prashant Shinde 
 * https://www.prashantshinde.in
 */

const exec = require('child_process').exec;
const inquirer = require('inquirer');
const chalk = require('chalk');

// constants
const LIST_BRANCH_CMD = "git branch";
const LIST_UNMERGED_BRANCH_CMD = "git branch --no-merged";
const DELETE_BRANCH_CMD = "git branch -d";
const DELETE_UNMERGED_BRANCH_CMD = "git branch -D";

/**
 * Load all local branches
 * @returns {Promise<Array<string>>} Promise that resolves into array of all local branch names.
 */
function getAllBranchNames() {
    return new Promise((resolve, reject) => {
        console.log("\nLoading Branches...");
        exec(LIST_BRANCH_CMD, (err, stdout, stderr) => {
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
 * @returns {Promise<string>} Promise that resolves user chosed branch name. Resolves 'Quit' in case user wants to quit.
 */
function showMenu(branchNames) {
    return new Promise((resolve, reject) => {
        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'branch',
                    message: 'Which branch do you want to delete?',
                    choices: [...branchNames, new inquirer.Separator(), 'Quit'],
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
 * @param {boolean} forced - delete branch even if unmerged
 * @returns {Promise<string>} Promise that resolves after deletion
 */
function deleteBranch(branchName, forced) {
    return new Promise(async (resolve, reject) => {
        console.log(chalk.cyan("\nDeleting branch " + branchName));
        let cmd = forced ? DELETE_UNMERGED_BRANCH_CMD : DELETE_BRANCH_CMD;
        exec(`${cmd} ${branchName}`, (err, stdout, stderr) => {
            if (stderr || err) {
                reject(stderr || err);
            } else {
                resolve(stdout);
            }
        });
    });
}

/**
 * Load unmerged local branches
 * @returns {Promise<Array<string>>} Promise that resolves into list of all unmerged branches.
 */
function getUnmergedBranchNames() {
    return new Promise((resolve, reject) => {
        exec(LIST_UNMERGED_BRANCH_CMD, (err, stdout, stderr) => {
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
}

/**
 * @param {string}  - name of the branch
 * @returns {Promise<boolean>} Promise that resolves into boolean indicating if branch is unmerged.
 */
async function isBranchUnmerged(branchName) {
    const unmergedBranches = await getUnmergedBranchNames();
    let unmerged = false;
    if (unmergedBranches.length && unmergedBranches.includes(branchName)) {
        unmerged = true;
    }
    return unmerged;
}

/**
 * @param {string} branchName - Name of the branch you want to delete
 * @returns {Promise} Resolves after operation is finised.
 */
async function tryDeleteBranch(branchName) {
    console.log(chalk.cyan(`\nAttempting to delete branch ${branchName}...\n`));
    const isUnmerged = await isBranchUnmerged(branchName);
    if (isUnmerged) {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'forced',
                message: 'Looks like the branch you want to delete is unmerged. Be careful! You will lose some changes. Do you still want to delete it? ',
            }
        ])
        if (answers && answers.forced) {
            await deleteBranch(branchName, true);
            console.log(chalk.bold.green(`\nBranch ${branchName} deleted successfully!`));
        } else {
            console.log(chalk.bold.cyan(`\nCool! Your work is valuable. We didn't delete branch ${branchName}.`));
        }
    } else {
        await deleteBranch(branchName, false);
        console.log(chalk.bold.green(`\nBranch ${branchName} deleted successfully!`));
    }
}

//driver function
async function main() {
    console.log(chalk.bgCyan("\n\nWelcome. Let's do some housekeeping on your git repository.\n"));
    try {
        var branchNames = await getAllBranchNames();
        var choice = await showMenu(branchNames);

        while (choice && choice !== 'Quit') {
            try {
                // try to delete branch.
                await tryDeleteBranch(choice);
                // try branch delete finished. reload branches.
                branchNames = await getAllBranchNames();
            } catch (err) {
                console.log(chalk.red("\nError while deleting the branch. Check error below and try again."));
                console.log(chalk.yellow(`\n${err}\n`));
            }
            choice = await showMenu(branchNames);
        };
    } catch (err) {
        console.log(chalk.yellow(`\n${err}\n`));
    } finally {
        console.log(chalk.cyan("\nGoodbye. For feedbacks visit - https://www.prashantshinde.in/#/connect"));
        process.exit();
    }
}

main();