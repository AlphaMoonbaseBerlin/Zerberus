import * as log from "https://deno.land/std/log/mod.ts";

export function new_logger( level:log.LevelName, name:string) {
    const prefab_options = {
        handlers: {
            console: new log.handlers.ConsoleHandler(level),
        },
        loggers : {}
        
    };

    prefab_options.loggers[ name ] = {
        level : level, 
        handlers : ["console"]
    }

    log.setup( prefab_options );
    return log.getLogger( name );
      
}