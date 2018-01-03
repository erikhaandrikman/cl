/**
 * Worker class operates on a {Queue}
 * @constructor ---------------- master
 */

var Worker = function( config ){
    /**
     * Worker job subscription
     * @type {Array}
     * @private
     */
    this._jobs = config.jobs;

    /**
     * List of current active jobs
     * @type {Set}
     */
    this.list = new Set();

    /**
     * Workers name
     */
    this.name = config.name;

    /**
     * Amount of jobs it can do at once
     * @type {number|*}
     */
    this.capacity = config.capacity || 1;

    /**
     * Is it an active worker
     * @type {boolean}
     */
    this.active = !!config.active;
};

Worker.prototype.work = function(){

    if(!this.list.size){
        return this.search();
    }

    if(this.list.size < this.capacity){
        this.search();
    }

    var jobs = Array.from(this.list), n = jobs.length;
    while(n--){
        jobs[n].tick++;
        if(jobs[n].tick >= jobs[n].max && !jobs[n].ready){
            // call if output is a function
            // else add it to output queue
            if(typeof jobs[n].output === 'function'){
                jobs[n].output.call(this,jobs[n])
            }else{
                jobs[n].output.add(jobs[n].job);
                // remove job from list
                this.list.delete(jobs[n]);
            }

            // set ready flag to true so we don't end up in a loop
            // with a jobs which is done. This way we can keep finished jobs
            // in a queue which can remove themself
            jobs[n].ready = true;
        }
    }
};

Worker.prototype.search = function(){

    var j = this._jobs, n = j.length;

    while(n--){
        if(j[n].input.size > 0){
            // get job
            var job = this.job = Array.from(j[n].input)[0];

            // add job to workers joblist
            this.list.add({
                job: job,
                output: j[n].output,
                tick: 0,
                max: j[n].duration || 1,
                desc: j[n].description,
                ready: false
            });

            // remove job from input queue
            j[n].input.delete(job);

            if(j[n].duration === 0){
                this.work();
            }
        }
    }
};
