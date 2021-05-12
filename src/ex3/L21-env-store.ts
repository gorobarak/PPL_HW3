import { add, map, zipWith,length, concat, indexOf, append, set, reduce} from "ramda";
import { Value } from './L21-value-store';
import { Result, makeFailure, makeOk, bind, either } from "../shared/result";

// ========================================================
// Box datatype
// Encapsulate mutation in a single type.
type Box<T> = T[];
const makeBox = <T>(x: T): Box<T> => ([x]);
const unbox = <T>(b: Box<T>): T => b[0];
const setBox = <T>(b: Box<T>, v: T): void => { b[0] = v; return; }

// ========================================================
// Store datatype
export interface Store {
    tag: "Store";
    vals: Box<Box<Value>[]>;
}

export const isStore = (x: any): x is Store => x.tag === "Store";
export const makeEmptyStore = ():Store => ({tag: "Store", vals: makeBox([])});
export const theStore: Store = makeEmptyStore();

export const extendStore = (s: Store, val: Value): Store =>{
        const prev_store = s.vals
        const ext_store = concat(unbox(prev_store),[makeBox(val)])
        setBox(prev_store,ext_store) //update s to have the ext store
        return s
}
    
    
export const applyStore = (store: Store, address: number): Result<Value> =>
    (address >= length(unbox(store.vals))) ? makeFailure("address out of bounds") :
    (address < 0 ) ? makeFailure("address out of bounds") :
    makeOk(unbox(unbox(store.vals)[address])) 


    
export const setStore = (store: Store, address: number, val: Value): void => 
    // should we take care of address which is out of bounds?
    setBox(unbox(store.vals)[address],val)

//returns the new addresses
export const mapExtendStore = (s: Store, vals: Value[]): number[] => {
    return reduce(
        (addresess_acc: number[], val: Value) => {
        return append(length(unbox(extendStore(theStore,val).vals)) - 1, addresess_acc)
    },
         [],
          vals)
}

export const lastAddress = (s: Store): number => length(unbox(s.vals)) - 1;



// ========================================================
// Environment data type
// export type Env = EmptyEnv | ExtEnv;
export type Env = GlobalEnv | ExtEnv;

interface GlobalEnv {
    tag: "GlobalEnv";
    vars: Box<string[]>;
    addresses: Box<number[]>
}

export interface ExtEnv {
    tag: "ExtEnv";
    vars: string[];
    addresses: number[];
    nextEnv: Env;
}

const makeGlobalEnv = (): GlobalEnv =>
    ({tag: "GlobalEnv", vars: makeBox([]), addresses:makeBox([])});

export const isGlobalEnv = (x: any): x is GlobalEnv => x.tag === "GlobalEnv";

// There is a single mutable value in the type Global-env
export const theGlobalEnv = makeGlobalEnv();

export const makeExtEnv = (vs: string[], addresses: number[], env: Env): ExtEnv =>
    ({tag: "ExtEnv", vars: vs, addresses: addresses, nextEnv: env});

const isExtEnv = (x: any): x is ExtEnv => x.tag === "ExtEnv";

export const isEnv = (x: any): x is Env => isGlobalEnv(x) || isExtEnv(x);

// Apply-env
export const applyEnv = (env: Env, v: string): Result<number> =>
    isGlobalEnv(env) ? applyGlobalEnv(env, v) :
    applyExtEnv(env, v);

const applyGlobalEnv = (env: GlobalEnv, v: string): Result<number> => {
    const vars = unbox(env.vars)
    const addresses = unbox(env.addresses)
    const index = indexOf(v,vars)
    return (index === -1) ? makeFailure(`${v} not found in environment`) : makeOk(addresses[index])
 }


    
export const globalEnvAddBinding = (v: string, addr: number): void => {
    const pre_vars = unbox(theGlobalEnv.vars)
    const pre_addresses = unbox(theGlobalEnv.addresses)
    const post_vars = append(v,pre_vars)
    const post_addresses = append(addr, pre_addresses)
    setBox(theGlobalEnv.vars, post_vars)
    setBox(theGlobalEnv.addresses, post_addresses)
}

const applyExtEnv = (env: ExtEnv, v: string): Result<number> =>
    env.vars.includes(v) ? makeOk(env.addresses[env.vars.indexOf(v)]) :
    applyEnv(env.nextEnv, v);
