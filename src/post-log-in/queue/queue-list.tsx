import React from 'react';
import {timeDiffInMinutes} from '../../logic/logic';
import {postQueue} from '../../util/api-functions';
import {Queue, Party} from '../../util/queue';
import PropTypes from 'prop-types';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {CaretUpFill, CaretDownFill, TrashFill} from 'react-bootstrap-icons';
import Button from 'react-bootstrap/Button';
import './queue-list.css';


interface ListProps {
  queue: Queue,
  currentPartyInfo: [Party, number] | undefined,
  showParty: (party: [Party, number]) => void,
  showAddModal: () => void,
  showDeleteModal: () => void,
  time: Date,
}

/**
 * A Card displaying the given queue with add/remove/swap functionality.
 * @param {ListProps} ListProps The properties of the queue to be displayed.
 * @return {jsx} A React Bootstrap Card filled with the given queue info
 * and functionality.
 */
const QueueList = ({queue, currentPartyInfo, time, showParty,
  showAddModal, showDeleteModal} : ListProps) => {
  const moveOne = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      index : number,
      offset: number,
  ) => {
    e.stopPropagation();
    if (index + offset >= 0 && index + offset < queue.parties.length) {
      const list : Party[] = queue.parties.slice();

      const target = list[index + offset];

      list[index + offset] = list[index];
      list[index] = target;

      const newQ : Queue = new Queue(
          queue.uid,
          queue.open,
          list,
      );
      if (currentPartyInfo) {
        showParty([currentPartyInfo[0], currentPartyInfo[1] + offset]);
      }
      postQueue(newQ);
    }
  };

  return (
    <Card id='queue-card'>
      <Card.Header>
        <Row>
          <Col md={1}>#</Col>
          <Col md={3}>Name</Col>
          <Col md={2}>Party</Col>
          <Col md={3}>Waiting</Col>
          <Col md={3}>Actions</Col>
        </Row>
      </Card.Header>
      <ListGroup id='queue' variant="flush">
        {queue.parties.map((person: Party, idx: number) =>
          (<ListGroup.Item
            className={
              (currentPartyInfo && currentPartyInfo[1] === idx) ?
                              ('queue-entry highlighted') : ('queue-entry')
            }
            key={idx}
            onClick={() => showParty([person, idx])}
          >
            <Row>
              <Col md={1}>
                {idx + 1}
              </Col>
              <Col md={3}>
                {person.firstName + ' ' + person.lastName}
              </Col>
              <Col md={2}>
                {person.size}
              </Col>
              <Col md={3}>
                {timeDiffInMinutes(time, person.checkIn)} minutes
              </Col>
              <Col md={3} id='action-buttons'>
                <Button
                  className='queue-list-buttons'
                  onClick={
                    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
                      moveOne(e, idx, -1)
                  }
                  variant={'secondary'}
                >
                  <CaretUpFill />
                </Button>
                <Button
                  className='queue-list-buttons'
                  onClick={
                    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
                      moveOne(e, idx, 1)
                  }
                  variant={'secondary'}
                >
                  <CaretDownFill />
                </Button>
                <Button
                  className='queue-list-buttons'
                  onClick={showDeleteModal}
                  variant={'secondary'}
                >
                  <TrashFill />
                </Button>
              </Col>
            </Row>
          </ListGroup.Item>))}
      </ListGroup>
      <Button
        id="add-customer-button"
        onClick={showAddModal}
        className={'button'}
      >
        Add a Party
      </Button>
    </Card>
  );
};

QueueList.propTypes = {
  queue: PropTypes.object,
  currentPartyInfo: PropTypes.object,
  time: PropTypes.object,
  showParty: PropTypes.func,
  showAddModal: PropTypes.func,
  showDeleteModal: PropTypes.func,
};

export default QueueList;
