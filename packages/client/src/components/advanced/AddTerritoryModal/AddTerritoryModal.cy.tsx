import React from 'react'
import { AddTerritoryModal } from './AddTerritoryModal'

describe('<AddTerritoryModal />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<AddTerritoryModal />)
  })
})