/* eslint-disable indent */
import React, {useState, useEffect} from 'react';
import {Business, BusinessLocation, getHoursArray} from '../../util/business';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import './profile.css';
import Col from 'react-bootstrap/Col';
import Map from '../google-components/profile-map';
import AddressAutocomplete from '../google-components/profile-autocomplete';
import LoadingProfile from './profile-loading';
import {auth} from '../../firebase';
import PropTypes from 'prop-types';
import {DAYS} from '../../util/business';
// eslint-disable-next-line no-unused-vars
import {Queue, Party} from '../../util/queue';
import ProfileHours from './profile-hours';
import {newQueue, postBusiness} from '../../util/api-functions';
import '../hub.css';
import {
  parsePhoneNum,
  // eslint-disable-next-line no-unused-vars
  ChangePhoneProps,
  changePhone,
} from '../../util/util-functions';

interface ProfileProps {
  uid: string;
  setBusiness: (b:Business) => void;
  business: Business | undefined | null;
  setQueue: (q: Queue) => void;
}

interface FormState {
  businessName: string;
  firstName: string;
  lastName: string;
  phone: string;
  type: string;
}

/**
 * The entirety of the profile page for the current user.
 * @param {ProfileProps} ProfileProps The current user's uid, business
 * and access to editing their business.
 * @return {jsx} The LoadingProfile or the user's profile Card.
 */
const ProfilePage = ({uid, setBusiness, business, setQueue}: ProfileProps) => {
  const initialState : FormState = {
    businessName: '',
    firstName: '',
    lastName: '',
    phone: '',
    type: '',
  };

  const [form, setForm] = useState<FormState>(initialState);
  const [address, setAddress] = useState<string>('');
  const [isBusinessLoading, setBusinessLoading] = useState<boolean>(true);
  const [building, setBuilding] =
    useState<google.maps.LatLng | undefined>(undefined);
  const [radius, setRadius] = useState<number>(50);
  const [editing, setEditing] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [openState, setOpenState] = useState<boolean[]>(DAYS.map(() => false));
  const [hours, setHours] =
    useState<[string, string][]>(DAYS.map(() => ['', '']));
  const [phoneDisplay, setPhoneDisplay] = useState<string>(initialState.phone);

  useEffect(() => {
    if (business !== null) {
      setBusinessLoading(false);
      if (business) {
        setForm({
          businessName: business.name,
          firstName: business.firstName,
          lastName: business.lastName,
          phone: business.locations[0].phoneNumber,
          type: business.type,
        });
        if (business.locations[0].hours.length !== 0) {
          setOpenState(business.locations[0].hours.map(
              (val: [Date | null, Date | null]) => val[0] !== null));
          setHours(business.locations[0].hours.map(
              (val: [Date | null, Date | null]) => {
                if (val[0] && val[1]) {
                  return [val[0].toTimeString().slice(0, 8),
                    val[1].toTimeString().slice(0, 8)];
                } else {
                  return ['', ''];
                }
              }));
        }
        setAddress(business.locations[0].address);
        setBuilding(new google.maps.LatLng(business.locations[0].coordinates[0],
            business.locations[0].coordinates[1]));
        setRadius(business.locations[0].geoFenceRadius);
        setBusiness(business);
        setPhoneDisplay(parsePhoneNum(business.locations[0].phoneNumber));
      } else if (business === undefined) {
        setEditing(true);
      }
    }
  }, [business, setBusiness]);

  /**
   * Cancels the current profile edits by changing all edited
   * form fields back to their current state in the database.
   * Turns off editing state.
   */
  const cancelEdits = () => {
    setEditing(false);
    enableOtherNavs();
    setForm({
      businessName: business!.name,
      firstName: business!.firstName,
      lastName: business!.lastName,
      phone: business!.locations[0].phoneNumber,
      type: business!.type,
    });
    if (business!.locations[0].hours.length !== 0) {
      setOpenState(business!.locations[0].hours.map(
          (val: [Date | null, Date | null]) => val[0] !== null));
      setHours(business!.locations[0].hours.map(
          (val: [Date | null, Date | null]) => {
            if (val[0] && val[1]) {
              return [val[0].toTimeString().slice(0, 8),
                val[1].toTimeString().slice(0, 8)];
            } else {
              return ['', ''];
            }
          }));
    }
    setAddress(business!.locations[0].address);
    setBuilding(new google.maps.LatLng(business!.locations[0].coordinates[0],
      business!.locations[0].coordinates[1]));
    setRadius(business!.locations[0].geoFenceRadius);
    setBusiness(business!);
    setPhoneDisplay(parsePhoneNum(business!.locations[0].phoneNumber));
  };

  /**
   * Updates the user's profile in the database upon submission of the
   * profile form.
   * @param {React.FormEvent<HTMLFormElement>} e The values in
   * the form when it was submitted.
   */
  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    if (allFieldsCompleted()) {
      setEditing(false);
      enableOtherNavs();
      const images = (business) ? business.locations[0].images : [];
      const locationHours : [Date | null, Date | null][] = getHoursArray(hours);
      const locationParams : [string, string, string,
        [Date | null, Date | null][], number[], string[], number, string[]] =
      [
        form.businessName,
        address,
        form.phone,
        locationHours,
        [building!.lat(), building!.lng()],
        [uid],
        radius,
        images,
      ];
      const newLocation : BusinessLocation[] = [
        new BusinessLocation(...locationParams),
      ];
      const newBusiness = new Business(
        form.businessName,
        form.firstName,
        form.lastName,
        auth.currentUser!.email!,
        uid,
        form.type,
        newLocation,
      );
      setBusiness(newBusiness);
      if (!business) {
        const returnedQueue : Queue = await newQueue(
          auth.currentUser!.uid,
        );
        setQueue(returnedQueue);
      }
      postBusiness(newBusiness);
    }
  };

  /**
   * Checks if the form has all of its fields filled out.
   * @return {boolean} true if form is complete, false otherwise.
   */
  const allFieldsCompleted : () => boolean = () => {
    for (const [, value] of Object.entries(form)) {
      if (value.length === 0) return false;
    }
    if (form.phone.length !== 10) return false;
    for (let i = 0; i < hours.length; i++) {
      if (openState[i] &&
        (hours[i][0].length === 0 || hours[i][1].length === 0)) {
        return false;
      }
    }
    return address.length > 0;
  };

 /**
   * Utilizes the changePhone util function to support formatted
   * phone number display while maintaining a stripped down phone
   * number string.
   * @param {string} next The user phone number input.
   */
  const changePhoneNum = (next: string) => {
    const {numbers, display}: ChangePhoneProps = changePhone(next);
    setForm({...form, phone: numbers});
    setPhoneDisplay(display);
  };

  return (
    isBusinessLoading ? <LoadingProfile/> :
    <div>
      <Form noValidate onSubmit={submitForm}>
        <Card id="profile-container">
          <div id="scroll-container">
            <div id="scroll-content-container">
              <Card.Title className="form-header-profile">
                Business Profile
              </Card.Title>
              <Card.Body>
                <Form.Group controlId="businessName">
                  <Form.Label>Business Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="businessName"
                    onChange={(e) =>
                      setForm({...form, businessName: e.target.value})}
                    value={form.businessName}
                    isValid={submitted &&
                      form.businessName.length > 0}
                    isInvalid={submitted &&
                      form.businessName.length === 0}
                    placeholder={'My Amazing Business'}
                    readOnly={!editing}
                  />
                  <Form.Control.Feedback type='invalid'>
                    Please Enter a Business Name
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="type">
                  <Form.Label>Business Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="type"
                    onChange={(e) =>
                      setForm({...form, type: e.target.value})}
                    value={form.type}
                    isValid={submitted &&
                      form.type.length > 0}
                    isInvalid={submitted &&
                      form.type.length === 0}
                    placeholder={'Pizzeria'}
                    readOnly={!editing}
                  />
                  <Form.Control.Feedback type='invalid'>
                    Please Enter a Business Name
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Row>
                  <Col>
                    <Form.Group controlId="firstName">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        placeholder="John"
                        onChange={(e) =>
                          setForm({...form, firstName: e.target.value})}
                        isValid={submitted && form.firstName.length > 0}
                        isInvalid={submitted && form.firstName.length === 0}
                        value={form.firstName}
                        readOnly={!editing}
                      />
                      <Form.Control.Feedback type='invalid'>
                        Please Enter a First Name
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group controlId="lastName">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        placeholder="Smith"
                        onChange={(e) =>
                          setForm({...form, lastName: e.target.value})}
                        isValid={submitted && form.lastName.length > 0}
                        isInvalid={submitted && form.lastName.length === 0}
                        value={form.lastName}
                        readOnly={!editing}
                      />
                      <Form.Control.Feedback type='invalid'>
                        Please Enter a Last Name
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Form.Row>
                <Form.Group controlId="phone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="phoneNumber"
                    value={phoneDisplay}
                    placeholder="###-###-####"
                    onChange={
                      (next) => changePhoneNum(next.target.value)
                    }
                    isInvalid={submitted &&
                      form.phone.length !== 10}
                    isValid={submitted &&
                      form.phone.length === 10}
                    readOnly={!editing}
                    maxLength={13}
                  />
                  <Form.Control.Feedback type='invalid'>
                    Please Enter A 10 Digit Phone Number
                  </Form.Control.Feedback>
                </Form.Group>
                <AddressAutocomplete
                  onChange={(s: string) => setAddress(s)}
                  isValid={submitted && address.length > 0}
                  isInvalid={submitted && address.length === 0}
                  setCenter={setBuilding}
                  editable={editing}
                  key={`${editing}`}
                  value={address}
                />
                <ProfileHours
                  values={hours}
                  setValues={setHours}
                  openState={openState}
                  setOpenState={setOpenState}
                  submitted={submitted}
                  editable={editing}
                />
                <Form.Group>
                  <Form.Label>Radius (m)</Form.Label>
                  <Form.Control
                    type='number'
                    value={Math.round(radius)}
                    readOnly
                  />
                  {editing &&
                    <Form.Text>Edit using the circle on the map.</Form.Text>}
                </Form.Group>
              </Card.Body>
            </div>
          </div>
          {!editing ? <Button
                variant='warning'
                key='edit'
                onClick={() => {
                  setEditing(true);
                  disableOtherNavs();
                }}
                id='edit-info-button'
                >
                  Edit Your Info
                </Button> :
                  business ? (
                    <div className='editing-button-group'>
                      <Button
                        key='cancel'
                        className='editing-button'
                        variant='danger'
                        onClick={() => cancelEdits()}
                      >
                        Cancel
                      </Button>
                      <Button
                        key='submit'
                        type='submit'
                        className='editing-button'
                        variant='success'
                        id='submit-changes-button'
                      >
                        Submit Changes
                      </Button>
                    </div>
                  ) : (
                    <Button
                      key='submit'
                      type='submit'
                      id='edit-info-button'
                      variant='success'
                    >
                      Submit Business Profile
                    </Button>
                  )
              }
        </Card>
      </Form>
      <Card id='map-container'>
        <Map
          buildingLocation={building}
          setRadius={setRadius}
          radius={radius}
          editable={editing}
        />
      </Card>
    </div>
  );
};

ProfilePage.propTypes = {
  uid: PropTypes.string,
  setBusiness: PropTypes.func,
  business: PropTypes.object,
  setQueue: PropTypes.func,
};

/**
 * Called when user is on 'profile' tab and begins editing their
 * profile. Disables other nav bar links so they cannot leave the page.
 */
const disableOtherNavs = () => {
  const otherNavs = document.getElementsByClassName('not-profile');
  for (let i = 0; i < otherNavs.length; i++) {
    otherNavs[i].classList.add('disabled');
  }
};

/**
 * Called when user is on 'profile' tab and finishes editing their
 * profile. Enables other nav bar links so they can leave the page again.
 */
const enableOtherNavs = () => {
  const otherNavs = document.getElementsByClassName('not-profile');
  for (let i = 0; i < otherNavs.length; i++) {
    otherNavs[i].classList.remove('disabled');
  }
};

export default ProfilePage;
