import { useState } from 'react';

const ReturnRequest = () => {
const [reason, setReason] = useState('');

const handleReasonChange = (event) => {
setReason(event.target.value);
};

const handleSubmit = (event) => {
event.preventDefault();
// Perform the return request submission logic here
// You can send the return request to your backend or perform any necessary actions
console.log(`Return request submitted. Reason: ${reason}`);
};

return (
<div>
    <h1>Initiate Return Request</h1>
    <form onSubmit={handleSubmit}>
        <div>
            <label htmlFor="reason">Reason for Return:</label>
            <input type="text" id="reason" value={reason} onChange={handleReasonChange} />
        </div>
        <button type="submit">Submit Return Request</button>
    </form>
</div>
);
};

export default ReturnRequest;