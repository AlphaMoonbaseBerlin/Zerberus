import * as Colors from "https://deno.land/std@0.170.0/fmt/colors.ts";

type colorFormatter = (str:string) => string
interface LogLevel {
    name:string
    color:colorFormatter
    background_color:colorFormatter
    level_value:number
}



class _LogLevels {
    TRACE : LogLevel = {
        name : "TRACE",
        color : Colors.white,
        background_color : Colors.bgBlack,
        level_value : 10
    }
    DEBUG : LogLevel = {
        name : "DEBUG",
        color : Colors.white,
        background_color : Colors.bgBlack,
        level_value : 20
    }
    INFO : LogLevel = {
        name : "INFO",
        color : Colors.brightBlue,
        background_color : Colors.bgBlack,
        level_value : 30
    }
    WARNING : LogLevel = {
        name : "WARNING",
        color : Colors.yellow,
        background_color : Colors.bgBlack,
        level_value : 40
    }
    ERROR : LogLevel = {
        name : "ERROR",
        color : Colors.brightRed,
        background_color : Colors.bgBlack,
        level_value : 50
    }
    CTRITICAL : LogLevel = {
        name : "CRITICAL",
        color : Colors.red,
        background_color : Colors.bgBlack,
        level_value : 60
    }
}

export const LogLevels = new _LogLevels();

interface Options  {
   name?     :string
   level?    :LogLevel
}

class _Options implements Options {
    name = "Logger"
    level:LogLevel = LogLevels.INFO
}

console.log()
export class Logger {
    options: _Options
    constructor( options:Options ) {
        this.options = Object.assign( new _Options(), options)
    }



    log( level:LogLevel, ...args:string[]) {
        if (this.options.level.level_value > level.level_value ) { return; }
        console.log(
            Colors.inverse( level.color( level.name.padEnd(9, " ").padStart(10, " "))),
            Colors.inverse( level.color( this.options.name.padEnd(16, " ").padStart(17, " "))),
            level.color( args.join(" ") )
        )
    }

    TRACE(...args:string[]) { this.log( LogLevels.TRACE, ...args )}
    DEBUG(...args:string[]) { this.log( LogLevels.DEBUG, ...args )}
    INFO(...args:string[]) { this.log( LogLevels.INFO, ...args )}
    WARNING(...args:string[]) { this.log( LogLevels.WARNING, ...args )}
    ERROR(...args:string[]) { this.log( LogLevels.ERROR, ...args )}
    CRITICAL(...args:string[]) { this.log( LogLevels.CTRITICAL, ...args )}
   
}