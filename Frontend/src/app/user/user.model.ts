export class User {
    constructor(public email: string,
        public password: string,
        public nickName?: string,
        public bio?: string,
        public jobStatus?: string,
        public education?: string,
        public birthday?: string,
        public firstName?: string,
        public lastName?: string,
        public profilePicture?: string,
        public images?: string[],
        public coverImage?: string,
        public credit?: number
    ) { }
}