declare module "hecks" {
  import type { Plugin } from "@hapi/hapi";
  import type { Application } from "express";

  export function toPlugin(
    handler: Application,
    name: string
  ): Plugin<Application>;
}
