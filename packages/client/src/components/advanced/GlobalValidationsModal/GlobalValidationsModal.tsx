import { ITerritoryValidation } from "@shared/types/territory";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { EntityDetailValidationRule } from "pages/Main/containers/EntityDetailBox/EntityDetail/EntityDetailValidationSection/EntityDetailValidationRule/EntityDetailValidationRule";
import React, { useEffect, useState } from "react";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";
import { rootTerritoryId } from "Theme/constants";
import {
  StyledBlockSeparator,
  StyledToggleWrap,
  StyledValidationList,
} from "./GlobalValidationsModalStyles";

interface GlobalValidationsModal {
  setShowGlobalValidations: React.Dispatch<React.SetStateAction<boolean>>;
}
export const GlobalValidationsModal: React.FC<GlobalValidationsModal> = ({
  setShowGlobalValidations,
}) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const {
    status,
    data: rootTerritory,
    error: entityError,
    isFetching,
  } = useQuery({
    queryKey: ["rootTerritoryDetail", rootTerritoryId],
    queryFn: async () => {
      const res = await api.detailGet(rootTerritoryId);
      return res.data;
    },
    // TODO: only for owner
    enabled: api.isLoggedIn(),
  });

  const [superclassMissing, setSuperclassMissing] = useState(true);
  const [missinActionEventEquivalent, setMissinActionEventEquivalent] =
    useState(true);

  const { validations } = rootTerritory?.data || {};

  const ToggleOn = () => (
    <>
      <FaToggleOn size={22} /> active
    </>
  );
  const ToggleOff = () => (
    <>
      <FaToggleOff size={22} /> disabled
    </>
  );

  return (
    <Modal
      showModal={showModal}
      onClose={() => setShowGlobalValidations(false)}
      width={650}
    >
      <ModalHeader title="Global validations" />
      <ModalContent column enableScroll>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "1rem",
            alignItems: "center",
            marginTop: "0.5rem",
            marginLeft: "0.8rem",
            marginBottom: "2.5rem",
          }}
        >
          <div
            style={{
              display: "grid",
              justifyContent: "end",
            }}
          >
            Superclass missing
          </div>
          <div>
            <StyledToggleWrap
              style={{ cursor: "pointer" }}
              onClick={() => setSuperclassMissing(!superclassMissing)}
            >
              {superclassMissing ? ToggleOn() : ToggleOff()}
            </StyledToggleWrap>
          </div>
          <div
            style={{
              display: "grid",
              justifyContent: "end",
              alignItems: "center",
            }}
          >
            Missing Action/event equivalent
          </div>
          <div>
            <StyledToggleWrap
              style={{ cursor: "pointer" }}
              onClick={() =>
                setMissinActionEventEquivalent(!missinActionEventEquivalent)
              }
            >
              {missinActionEventEquivalent ? ToggleOn() : ToggleOff()}
            </StyledToggleWrap>
          </div>
        </div>

        {rootTerritory && validations && (
          <StyledValidationList>
            {(validations as ITerritoryValidation[]).map((validation, key) => {
              return (
                <React.Fragment key={key}>
                  <EntityDetailValidationRule
                    key={key}
                    validation={validation}
                    entities={rootTerritory.entities}
                    updateValidationRule={(
                      changes: Partial<ITerritoryValidation>
                    ) => {
                      // handleUpdateValidation(key, changes);
                    }}
                    removeValidationRule={() => {
                      // setTempIndexToRemove(key)
                    }}
                    isInsideTemplate={false}
                    userCanEdit
                  />
                  {key !== validations.length - 1 && <StyledBlockSeparator />}
                </React.Fragment>
              );
            })}
          </StyledValidationList>
        )}
        <Loader show={isFetching} />
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            color="warning"
            label="cancel"
            onClick={() => setShowGlobalValidations(false)}
          />
          <Button color="primary" label="submit" />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
