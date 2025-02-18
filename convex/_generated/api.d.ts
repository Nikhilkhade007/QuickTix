/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as constant from "../constant.js";
import type * as events from "../events.js";
import type * as storage from "../storage.js";
import type * as ticket from "../ticket.js";
import type * as users from "../users.js";
import type * as waiting from "../waiting.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  constant: typeof constant;
  events: typeof events;
  storage: typeof storage;
  ticket: typeof ticket;
  users: typeof users;
  waiting: typeof waiting;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
