import { Command, flags } from "@oclif/command";
import {
  checkDeprecated,
  getVersion,
  isBadVersion,
  addHuskyHook
} from "../functions/funtions";

const { red, green, yellow, blue } = require("kleur");
const { exec } = require("child_process");
const fs = require("fs");

const getPackageLastVersion = async function(
  name: string,
  currentVersion: string = "",
  type: string = ""
) {
  exec(`npm view ${name} --json`, (error: any, stdout: any) => {
    const data = JSON.parse(stdout);
    const result = {
      name: data.name,
      latest: data.version,
      lastUpdate: data.time.modified,
      deprecated: checkDeprecated(data.time.modified),
      current: getVersion(currentVersion),
      badCurrent: isBadVersion(currentVersion)
    };
    console.log(
      type,
      result.name.padEnd(40),
      result.badCurrent
        ? yellow(result.current.padEnd(20))
        : result.current.padEnd(20),
      result.current !== result.latest
        ? yellow(result.latest.padEnd(20))
        : green(result.latest.padEnd(20)),
      result.deprecated ? red("Yes") : green("No")
    );
  });
};

const addPrettier = async (data: any) => {
  return {
    ...data.dependencies,
    husky: await getPackageLastVersion("husky"),
    prettier: await getPackageLastVersion("prettier"),
    "pretty-quick": await getPackageLastVersion("pretty-quick")
  };
};

const writeDependencies = async (dependencies: any = null, type: string) => {
  if (dependencies) {
    for (let item in dependencies) {
      await getPackageLastVersion(item, dependencies[item], type);
    }
  }
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
        `${"Dependency".padEnd(15)}${"Name".padEnd(40)}${"Current".padEnd(
          20
        )}${"Latest".padEnd(20)}${"Deprecated".padEnd(20)}`
      )
    );
    await writeDependencies(
      data.dependencies,
      green("dependencies".padEnd(15))
    );
    await writeDependencies(
      data.devDependencies,
      yellow("devDependencies".padEnd(15))
    );
    await writeDependencies(
      data.peerDependencies,
      blue("peerDependencies".padEnd(15))
    );

    // TODO добавить хаски на прекоммит, нужно вынести в отдельную команду
    // TODO нужно получать последние версии преттиера, хаски и претти-квика
    // TODO нужно добавить возможность добавить eslint, посмотреть еще возможность кастомизировать строку
    /*
    data.dependencies = await addPrettier(data.dependencies);
    data = await addHuskyHook(data);
*/
    // TODO сделать сохранение с форматированием
    fs.writeFileSync("package.json", JSON.stringify(data, null, 4));
  }
}
