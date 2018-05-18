export class Post {
    constructor(
        public content: string, 
        public nickName: string, 
        public subject: string[], 
        public created: string, 
        public likes?: string[], 
        public dislikes?: string[], 
        public comments?: any[], 
        public shares?: any[],
        public postId?: string,
        public userId?: string, 
        public profilePicture?: string, 
        public image?: string,
        public linkContent?: any,
        public group?: string,
        public isShared?: boolean
    ) {}
}