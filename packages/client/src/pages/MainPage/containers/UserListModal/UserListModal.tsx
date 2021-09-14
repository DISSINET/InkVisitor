import React from "react";
import { Column, useTable, useExpanded, Row } from "react-table";
import { Modal, ModalHeader, ModalContent, ModalFooter, Button, ButtonGroup } from "components";
import { useQuery } from "react-query";
import api from "api";

interface UserListModal {
  isOpen: boolean;
  handler: Function; 
}

export const UserListModal: React.FC = (modVals: UserListModal) => {
   const { status, data, error, isFetching } = useQuery(
    ["users"],
    async () => {
      const res = await api.usersGetMore({});
      return res.data;
    },
    { enabled: api.isLoggedIn() }
  );
   
   console.log(data)

    return (
    <Modal showModal={modVals.isOpen} onClose={() => modVals.handler()} >
     <ModalHeader title={"Manage Users"} />
      <ModalContent>
       <table>
        <thead>
        </thead>
        <tbody>
        </tbody>
        {data && (data.map((row, i) =>{
           return(
            <tr><td>{row.name}</td><td>{row.email}</td><td>{row.role}</td></tr> 
           )
        }))}
       </table>

      </ModalContent>
      <ModalFooter>
      <ButtonGroup>
        <Button
          key="close"
          label="Close"
          color="primary"
          inverted
          onClick={() => modVals.handler()}
        />
      </ButtonGroup>
      </ModalFooter>
    </Modal>
    );
};
