import React from 'react'
import { Tag } from './Tag'

describe('<Tag />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Tag />)
  })
})