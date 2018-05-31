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
        public credit?: number,

        public twitterLink?: string,
        public youtubeLink?: string,
        public linkedinLink?: string,
        public googleplusLink?: string,
        public snapchatLink?: string,
        public instagramLink?: string,
    ) { }
}