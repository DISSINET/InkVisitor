import React from 'react'
import { LoginModal } from './LoginModal'

describe('<LoginModal />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<LoginModal />)
  })
})