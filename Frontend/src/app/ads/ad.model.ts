export class Ad {
    constructor(
        public adId: string,
        public title: string, 
        public content: string, 
        public picture: string,
        public created: string,
        public userId: string
    ) {}
}