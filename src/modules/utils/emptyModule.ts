export interface Options {

}

class _Options implements Options {

}

export class Module {
    options : Options
    constructor( options:Options ) {
        this.options = Object.assign( new _Options, options)
    }
}