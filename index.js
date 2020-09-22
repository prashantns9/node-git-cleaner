var exec = require('child_process').exec;
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
        for (let i = 0; i < branchNames.length; i++) {
            console.log(`${i + 1}. ${branchNames[i]}`);
        }

        rl.question('\nEnter branch number that you want to delete or (q) to exit: ', (choice) => {
            resolve(choice);
        });
    });
}

/**
 * 
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

        while (choice !== 'q') {
            let choiceNum = parseInt(choice);
            if (typeof (choiceNum) === "number" && choiceNum > 0 && choiceNum <= branchNames.length) {
                // delete branch
                await deleteBranch(branchNames[choiceNum - 1]);
                // reload branches
                branchNames = await getBranchNames();
            } else {
                console.log("\n\nInvalid Entry!\n\n");
            }
            choice = await showMenu(branchNames);
        };
    } catch (err) {
        console.log(err);
    } finally {
        process.exit();
    }
}

main();