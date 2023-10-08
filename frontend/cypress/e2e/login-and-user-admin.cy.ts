import {
  LOGIN_URL,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
  NEW_USER_NAME,
  NEW_USER_EMAIL,
  NEW_USER_PASSWORD,
  UNKNOWN_EMAIL,
  WRONG_PASSWORD,
  UPDATED_USER_NAME,
  UPDATED_EMAIL,
  UPDATED_PASSWORD,
  RESET_PASSWORD,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  H1_SIGN_IN,
  H1_REGISTER_ACCOUNT,
  H1_PRODUCTS,
  H1_MY_PROFILE,
  H1_CHANGE_PASSWORD,
  H1_RESET_PASSWORD,
  H1_RESET_PASSWORD_CONFIRMATION,
  H1_USERS,
  H1_EDIT_USER,
  H2_MY_ORDERS,
  THAT_EMAIL_ALREADY_EXISTS,
  INVALID_EMAIL_OR_PASSWORD,
  INVALID_EMAIL_ADDRESS,
  REQUIRED,
  THIS_EMAIL_ADDRESS_IS_NOT_KNOWN_TO_US,
  YOU_HAVE_NO_ORDERS,
  COLOR_GREEN,
  ARE_YOU_SURE_YOU_WANT_TO_DELETE_THIS_USER,
} from '../test_constants';

describe('Initialize', () => {
  it('Clears cookies and localStorage', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });
  it('Seeds test database', () => {
    cy.exec('cd .. && cd backend && npm run data:import');
  });
});

describe('Test registration of new account', () => {
  beforeEach(() => cy.visit(LOGIN_URL));
  it('Opens Sign In page', () => {
    cy.get('h1').invoke('text').should('equal', H1_SIGN_IN);
  });
  it('Opens register screen and enters new account', () => {
    cy.get('[id="LINK_register_new_customer"]').click();
    cy.get('h1').invoke('text').should('equal', H1_REGISTER_ACCOUNT);
    cy.get('[id="name"]').type(NEW_USER_NAME);
    cy.get('[id="email"]').type(NEW_USER_EMAIL);
    cy.get('[id="password"]').type(NEW_USER_PASSWORD);
    cy.get('[id="BUTTON_register"]').click();
    cy.get('h1').invoke('text').should('equal', H1_PRODUCTS);
  });
  it('Opens register screen enters already existing account', () => {
    cy.get('[id="LINK_register_new_customer"]').click();
    cy.get('h1').invoke('text').should('equal', H1_REGISTER_ACCOUNT);
    cy.get('[id="name"]').type(NEW_USER_NAME);
    cy.get('[id="email"]').type(NEW_USER_EMAIL);
    cy.get('[id="password"]').type(NEW_USER_PASSWORD);
    cy.get('[id="BUTTON_register"]').click();
    cy.get('[id="alert_error"]')
      .invoke('text')
      .should('equal', THAT_EMAIL_ALREADY_EXISTS);
  });
  it('Opens register screen and clicks Login (Already have an account)', () => {
    cy.get('[id="LINK_register_new_customer"]').click();
    cy.get('h1').invoke('text').should('equal', H1_REGISTER_ACCOUNT);
    cy.get('[id="LINK_already_have_an_account"]').click();
    cy.get('h1').invoke('text').should('equal', H1_SIGN_IN);
  });
});
describe('Test logging in', () => {
  beforeEach(() => cy.visit(LOGIN_URL));
  it('Opens Sign In page', () => {
    cy.get('h1').invoke('text').should('equal', H1_SIGN_IN);
  });
  it('Signs in correctly with test account', () => {
    cy.get('[id="email"]').type(TEST_USER_EMAIL);
    cy.get('[id="password"]').type(TEST_USER_PASSWORD);
    cy.get('[id="BUTTON_login"]').click();
    cy.get('h1').invoke('text').should('equal', H1_PRODUCTS);
  });
  it('Signs in with unknown account', () => {
    cy.get('[id="email"]').type(UNKNOWN_EMAIL);
    cy.get('[id="password"]').type(TEST_USER_PASSWORD);
    cy.get('[id="BUTTON_login"]').click();
    cy.get('[id="alert_error"]')
      .invoke('text')
      .should('equal', INVALID_EMAIL_OR_PASSWORD);
  });
  it('Signs in with incorrect password', () => {
    cy.get('[id="email"]').type(TEST_USER_EMAIL);
    cy.get('[id="password"]').type(WRONG_PASSWORD);
    cy.get('[id="BUTTON_login"]').click();
    cy.get('[id="alert_error"]')
      .invoke('text')
      .should('equal', INVALID_EMAIL_OR_PASSWORD);
  });
  it('Enters invalid email address and leaves password field empty', () => {
    cy.get('[id="email"]').type('test');
    cy.get('[id="password"]').focus();
    cy.get('[id="error_text_email"]')
      .invoke('text')
      .should('equal', INVALID_EMAIL_ADDRESS);
    cy.get('[id="email"]').focus();
    cy.get('[id="error_text_password"]')
      .invoke('text')
      .should('equal', REQUIRED);
  });
});
describe('Test profile and password update', () => {
  beforeEach(() => cy.visit(LOGIN_URL));
  it('Change username and email', () => {
    cy.get('[id="email"]').type(NEW_USER_EMAIL);
    cy.get('[id="password"]').type(NEW_USER_PASSWORD);
    cy.get('[id="BUTTON_login"]').click();
    cy.get('h1').invoke('text').should('equal', H1_PRODUCTS);
    cy.get('[id="LINK_header_username"]').click();
    cy.get('[id="LINK_my_profile"]').click();
    cy.get('h1').invoke('text').should('equal', H1_MY_PROFILE);
    cy.get('[id="name"]').clear().type(UPDATED_USER_NAME);
    cy.get('[id="email"]').clear().type(UPDATED_EMAIL);
    cy.get('[id="BUTTON_update"]').click();
    // Check there are no errors
    cy.get('alert_error').should('not.exist');
    cy.get('error_message').should('not.exist');
  });
  it('Change password', () => {
    cy.get('[id="email"]').type(UPDATED_EMAIL);
    cy.get('[id="password"]').type(NEW_USER_PASSWORD);
    cy.get('[id="BUTTON_login"]').click();
    cy.get('h1').invoke('text').should('equal', H1_PRODUCTS);
    cy.get('[id="LINK_header_username"]').click();
    cy.get('[id="LINK_my_profile"]').click();
    cy.get('[id="LINK_change_password"]').click();
    cy.get('h1').invoke('text').should('equal', H1_CHANGE_PASSWORD);
    cy.get('[id="currentPassword"]').type(NEW_USER_PASSWORD);
    cy.get('[id="newPassword"]').type(UPDATED_PASSWORD);
    cy.get('[id="BUTTON_update"]').click();
    // Check there are no errors
    cy.get('alert_error').should('not.exist');
    cy.get('error_message').should('not.exist');
  });
  it('Login in with new email and password', () => {
    cy.get('[id="email"]').type(UPDATED_EMAIL);
    cy.get('[id="password"]').type(UPDATED_PASSWORD);
    cy.get('[id="BUTTON_login"]').click();
    cy.get('h1').invoke('text').should('equal', H1_PRODUCTS);
  });
  it('Opens Reset Password page from login screen', () => {
    cy.get('[id="LINK_reset_password"]').click();
    cy.get('h1').invoke('text').should('equal', H1_RESET_PASSWORD);
  });
  it('Tries to reset password with unknown email address', () => {
    cy.get('[id="LINK_reset_password"]').click();
    cy.get('[id="email"]').type(UNKNOWN_EMAIL);
    cy.get('[id="BUTTON_reset_password"]').click();
    cy.get('h1').invoke('text').should('equal', H1_RESET_PASSWORD);
    cy.get('[id="alert_error"]')
      .invoke('text')
      .should('equal', THIS_EMAIL_ADDRESS_IS_NOT_KNOWN_TO_US);
  });
  it('Reset password with correct email address', () => {
    cy.get('[id="LINK_reset_password"]').click();
    cy.get('[id="email"]').type(UPDATED_EMAIL);
    cy.get('[id="BUTTON_reset_password"]').click();
    cy.get('h1').invoke('text').should('equal', H1_RESET_PASSWORD_CONFIRMATION);
  });
  it('Login in with new email and password', () => {
    cy.get('[id="email"]').type(UPDATED_EMAIL);
    cy.get('[id="password"]').type(RESET_PASSWORD);
    cy.get('[id="BUTTON_login"]').click();
    cy.get('h1').invoke('text').should('equal', H1_PRODUCTS);
  });
});
describe('Test logout', () => {
  beforeEach(() => cy.visit(LOGIN_URL));
  it('Logout', () => {
    cy.get('[id="email"]').type(UPDATED_EMAIL);
    cy.get('[id="password"]').type(RESET_PASSWORD);
    cy.get('[id="BUTTON_login"]').click();
    cy.get('[id="LINK_header_username"]').click();
    cy.get('[id="LINK_header_logout"]').click();
    cy.get('h1').invoke('text').should('equal', H1_SIGN_IN);
  });
});
describe('Test my orders', () => {
  beforeEach(() => cy.visit(LOGIN_URL));
  it('Test there are no orders', () => {
    cy.get('[id="email"]').type(UPDATED_EMAIL);
    cy.get('[id="password"]').type(RESET_PASSWORD);
    cy.get('[id="BUTTON_login"]').click();
    cy.get('[id="LINK_header_username"]').click();
    cy.get('[id="LINK_my_orders"]').click();
    cy.get('h2').invoke('text').should('equal', H2_MY_ORDERS);
    cy.contains(YOU_HAVE_NO_ORDERS);
  });
});
describe('Test Administration of Users', () => {
  beforeEach(() => cy.visit(LOGIN_URL));
  it('Edit and delete a user by admin account', () => {
    cy.get('h1').invoke('text').should('equal', H1_SIGN_IN);
    cy.get('[id="email"]').type(ADMIN_EMAIL);
    cy.get('[id="password"]').type(ADMIN_PASSWORD);
    cy.get('[id="BUTTON_login"]').click();
    cy.get('h1').invoke('text').should('equal', H1_PRODUCTS);
    cy.get('[id="LINK_header_adminmenu"]').click();
    cy.get('[id="LINK_header_users"]').click();
    cy.get('h1').invoke('text').should('equal', H1_USERS);
    // Check there are no errors
    cy.get('alert_error').should('not.exist');
    cy.get('error_message').should('not.exist');
    // Select user to administrate
    let queryId: string = `[id="edit_` + UPDATED_EMAIL + `"]`;
    cy.get(queryId).click();
    cy.get('h1').invoke('text').should('equal', H1_EDIT_USER);
    // Change user name and email
    cy.get('[id="name"]').clear().type(NEW_USER_NAME);
    cy.get('[id="email"]').clear().type(NEW_USER_EMAIL);
    cy.get('[type="checkbox"]').check();
    cy.get('[id="BUTTON_update"]').click();
    // Check updated name and email are shown in users list
    cy.get('h1').invoke('text').should('equal', H1_USERS);
    queryId = `[id="name_` + NEW_USER_EMAIL + `"]`;
    cy.get(queryId).invoke('text').should('equal', NEW_USER_NAME);
    queryId = `[id="email_` + NEW_USER_EMAIL + `"]`;
    cy.get(queryId).invoke('text').should('equal', NEW_USER_EMAIL);
    queryId = `[id="admin_` + NEW_USER_EMAIL + `"]`;
    cy.get(queryId).find('svg').should('have.css', 'color', COLOR_GREEN);
    // Test deleting a user
    queryId = `[id="delete_` + NEW_USER_EMAIL + `"]`;
    cy.get(queryId).click();
    cy.contains(ARE_YOU_SURE_YOU_WANT_TO_DELETE_THIS_USER);
    cy.get('[id="BUTTON_yes"]').click();
    queryId = `[id="email_` + NEW_USER_EMAIL + `"]`;
    cy.get(queryId).should('not.exist');
  });
});
