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
import { ValidationRule } from "components/advanced";
import React, { useEffect, useState } from "react";
import { FaPlus, FaToggleOff, FaToggleOn } from "react-icons/fa";
import { rootTerritoryId } from "Theme/constants";
import {
  StyledBlockSeparator,
  StyledGridForm,
  StyledGridFormLabel,
  StyledSectionHeader,
  StyledToggleWrap,
  StyledValidationCount,
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
      <FaToggleOff size={22} /> inactive
    </>
  );

  return (
    <Modal
      showModal={showModal}
      onClose={() => setShowGlobalValidations(false)}
      width={650}
    >
      <ModalHeader title="Global validations" boldTitle />
      <ModalContent column enableScroll>
        <StyledGridForm>
          <StyledGridFormLabel>Superclass missing</StyledGridFormLabel>
          <div>
            <StyledToggleWrap
              $active={superclassMissing}
              style={{ cursor: "pointer" }}
              onClick={() => setSuperclassMissing(!superclassMissing)}
            >
              {superclassMissing ? ToggleOn() : ToggleOff()}
            </StyledToggleWrap>
          </div>
          <StyledGridFormLabel>
            Missing Action/event equivalent
          </StyledGridFormLabel>
          <div>
            <StyledToggleWrap
              $active={missinActionEventEquivalent}
              style={{ cursor: "pointer" }}
              onClick={() =>
                setMissinActionEventEquivalent(!missinActionEventEquivalent)
              }
            >
              {missinActionEventEquivalent ? ToggleOn() : ToggleOff()}
            </StyledToggleWrap>
          </div>
        </StyledGridForm>

        {rootTerritory && validations && (
          <>
            <StyledSectionHeader>
              <b>Root T validation</b>
              <StyledValidationCount>{`${validations.length} Root T validations`}</StyledValidationCount>
              <span>
                <Button
                  icon={<FaPlus />}
                  label="new validation rule"
                  color="primary"
                  // onClick={initValidationRule}
                />
              </span>
            </StyledSectionHeader>
            <StyledValidationList>
              {(validations as ITerritoryValidation[]).map(
                (validation, key) => {
                  return (
                    <React.Fragment key={key}>
                      <ValidationRule
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
                      {key !== validations.length - 1 && (
                        <StyledBlockSeparator />
                      )}
                    </React.Fragment>
                  );
                }
              )}
            </StyledValidationList>
          </>
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
