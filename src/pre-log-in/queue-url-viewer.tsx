import {useEffect, useState} from 'react';
import {Queue, Party} from '../util/queue';
import getQueue from '../util/get-queue';
import React from 'react';
import { QueueURLParamViewer } from '../post-log-in/queue-view';
import { QueueListener } from '../util/queue-listener';


const QueueURLViewer = () => {
  const [isQueueLoading, setQueueLoading] = useState<boolean>(true);
  const [queue, setQueue] = useState<Queue | undefined>(undefined);
  const [phoneNum, setPhoneNum] = useState<string>('');
  const [time, setTime] = useState<Date>(new Date());
  const [listener, setListener] = useState<QueueListener | undefined>(undefined);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (!urlParams.has('queue') || !urlParams.has('phoneNumber')) {
      window.location.href = '/404';
    } else {
      const uid : string = urlParams.get('queue')!;
      setPhoneNum(urlParams.get('phoneNumber')!);
      queryForQueue(uid);
      setListener(new QueueListener(uid, (newQ: Queue) => setQueue(newQ)));
    }
    return () => {
      if (listener) {
        listener!.free();
      }
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (queue) {
      setQueueLoading(false);
    }
  }, [queue]);

  const queryForQueue = async (uid: string) => {
    const val : Queue | undefined = await getQueue(uid);
    setQueue(val);
  };

  return (isQueueLoading) ?
    <div>loading</div> :
    <QueueURLParamViewer queue={queue!} phoneNum={phoneNum} time={time}/>;
};

// Example:
// http://localhost:3000/url-based-queue/?queue=sample-queue1&phoneNumber=1

export default QueueURLViewer;