import { SMClientPage } from './app.po';

describe('smclient App', () => {
  let page: SMClientPage;

  beforeEach(() => {
    page = new SMClientPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
