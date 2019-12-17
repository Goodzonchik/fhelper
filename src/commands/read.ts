import { Command, flags } from "@oclif/command";

import {
  checkDeprecated,
  getVersion,
  isBadVersion,
  addHuskyHook,
  getPercent
} from "../functions/funtions";

const { cli } = require("cli-ux");
const { red, green, yellow, blue } = require("kleur");
const { exec } = require("child_process");
const fs = require("fs");

const getPackageLastVersion = (name: string) => exec(`npm view ${name} --json`);
/*
const addPrettier = async (data: any) => {
  return {
    ...data.dependencies,
    husky: await getPackageLastVersion("husky"),
    prettier: await getPackageLastVersion("prettier"),
    "pretty-quick": await getPackageLastVersion("pretty-quick")
  };
};*/

const total = {
  dependencies: 0,
  deprecated: 0,
  canUpdated: 0,
  potentialDanger: 0
};

const npmInstallDialogue = async () => {
  await cli
    .prompt('Install package as "npm install"? (y/n)')
    .then((value: string) => {
      if (value.toLowerCase() === "y") {
        const child = exec(`npm install`);
        child.stdout.on("data", function(data: any) {
          console.log(data);
        });
      } else {
        console.log("no install");
      }
    });
};

const getSyncExec = (array: any[]) => {
  const first = array[0];
  const child = getPackageLastVersion(first.name);
  child.stdout.on("data", function(data: any) {
    const x = JSON.parse(data);
    const result = {
      name: x.name,
      latest: x.version,
      lastUpdate: x.time.modified,
      deprecated: checkDeprecated(x.time.modified),
      current: getVersion(first.value),
      badCurrent: isBadVersion(first.value)
    };
    if (isBadVersion(first.value)) {
      total.potentialDanger++;
    }
    if (result.current !== result.latest) {
      total.canUpdated++;
    }
    if (result.deprecated) {
      total.deprecated++;
    }
    total.dependencies++;
    console.log(
      first.type,
      result.name.padEnd(40),
      result.badCurrent
        ? yellow(result.current.padEnd(20))
        : result.current === result.latest
        ? green(result.current.padEnd(20))
        : result.current.padEnd(20),
      result.latest.padEnd(20),
      result.deprecated ? red("Yes".padEnd(20)) : green("No".padEnd(20))
    );
    array.shift();
    if (array.length > 0) {
      getSyncExec(array);
    } else {
      console.log(green("\nTOTAL"));
      console.log(
        "Dependencies".padEnd(20),
        total.dependencies.toString().padEnd(5),
        `${getPercent(total.dependencies, total.dependencies)}%`
      );
      console.log(
        "Can updated".padEnd(20),
        total.canUpdated > 0
          ? yellow(total.canUpdated.toString().padEnd(5))
          : "0".toString().padEnd(5),
        `${getPercent(total.dependencies, total.canUpdated)}%`
      );
      console.log(
        "Deprecated".padEnd(20),
        total.deprecated > 0
          ? red(total.deprecated.toString().padEnd(5))
          : "0".toString().padEnd(5),
        `${getPercent(total.dependencies, total.deprecated)}%`
      );
      console.log(
        "Potential danger".padEnd(20),
        total.potentialDanger > 0
          ? yellow(total.potentialDanger.toString().padEnd(5))
          : "0".toString().padEnd(5),
        `${getPercent(total.dependencies, total.potentialDanger)}%`
      );
      console.log(
        "\nDeprecated packages are packages that have not been updated for more than a year.\nPotentially dangerous packages are packages that have a major version of 0, or alpha, beta, or release condit"
      );
    }
  });
};

const writeDependencies = (array: any[] = []) => {
  getSyncExec(array);
};

const getDependenciesArray = (dependencies: any, type: string) => {
  const array = [];
  if (dependencies) {
    for (let item in dependencies) {
      array.push({
        name: item,
        value: dependencies[item],
        type: type,
        current: dependencies[item]
      });
    }
  }
  return array;
};

export default class Read extends Command {
  static description = "read package.json";
  /*
  static examples = [];

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: "n", description: "name to print" }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" })
  };*/

  static args = [{ name: "file" }];

  async run() {
    const { args, flags } = this.parse(Read);
    const packageData = fs.readFileSync("package.json");
    let data = JSON.parse(packageData);

    console.log(
      yellow(
        `${"Dependency".padEnd(20)} ${"Name".padEnd(40)} ${"Current".padEnd(
          20
        )} ${"Latest".padEnd(20)} ${"Deprecated".padEnd(20)}`
      )
    );
    const dependenciesArray = [
      ...getDependenciesArray(
        data.dependencies,
        green("dependencies".padEnd(20))
      ),
      ...getDependenciesArray(
        data.devDependencies,
        yellow("devDependencies".padEnd(20))
      ),
      ...getDependenciesArray(
        data.peerDependencies,
        blue("peerDependencies".padEnd(20))
      )
    ];
    writeDependencies(dependenciesArray);

    // TODO добавить хаски на прекоммит, нужно вынести в отдельную команду
    // TODO нужно получать последние версии преттиера, хаски и претти-квика
    // TODO нужно добавить возможность добавить eslint, посмотреть еще возможность кастомизировать строку
    /*
    data.dependencies = await addPrettier(data.dependencies);
    data = await addHuskyHook(data);
*/
    // TODO сделать сохранение с форматированием
    // fs.writeFileSync("package.json", JSON.stringify(data, null, 4));
  }
}
