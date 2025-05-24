# speed-logger
A FINAL PROJECT ON AUTOMOBILE OVERSPEEDING WITH CLOUD LOGGING FACILITIES FROM THE DEPARTMENT OF COMPUTER ENGINEERING OF THE UNIVERSITY OF ILORIN, NIGERIA. 

## 📡 Device API Documentation

Base URL: `/api/devices`

All endpoints return JSON responses.

### 🔐 Authentication

> Except for `POST /api/devices`, all routes **require an API key** in the request headers:

```
x-api-key: your-device-api-key
```

---

### 📥 Create a Device

**POST** `/api/devices`

Creates a new device and generates an API key.

#### Request Body:

```json
{
  "device_id": "device123",
  "name": "Weather Station",
  "location": "Lagos, Nigeria"
}
```

#### Response:

```json
{
  "success": true,
  "message": "Device created successfully",
  "data": {
    "id": 1,
    "device_id": "device123",
    "name": "Weather Station",
    "api_key": "generated_api_key",
    "location": "Lagos, Nigeria"
  }
}
```

---

### 📃 List All Devices

**GET** `/api/devices`

**Headers**:

```
x-api-key: your-device-api-key
```

#### Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_id": "device123",
      "name": "Weather Station",
      "location": "Lagos, Nigeria",
      "status": "active",
      "created_at": "...",
      "updated_at": "..."
    },
    ...
  ]
}
```

---

### 🔍 Get Device by ID

**GET** `/api/devices/:id`

**Headers**:

```
x-api-key: your-device-api-key
```

#### Response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "device_id": "device123",
    "name": "Weather Station",
    "location": "Lagos, Nigeria",
    "status": "active"
  }
}
```

---

### ✏️ Update a Device

**PUT** `/api/devices/:id`

**Headers**:

```
x-api-key: your-device-api-key
```

#### Request Body (any of the fields):

```json
{
  "name": "New Name",
  "location": "New Location",
  "status": "inactive"
}
```

#### Response:

```json
{
  "success": true,
  "message": "Device updated successfully",
  "data": {
    "id": 1,
    "device_id": "device123",
    "name": "New Name",
    ...
  }
}
```

---

### ♻️ Regenerate API Key

**POST** `/api/devices/:id/regenerate-key`

⚠️ **Security Note:** Only allow this action by an **authenticated admin user** or after verifying device credentials. Currently, **anyone who knows the device ID can regenerate the API key**, which is a **security risk**.

You should:

* Protect this endpoint with an admin-level API key
* Or add some form of authentication (e.g., pass an admin JWT in headers)

**Example Improvement:**
Require an admin key:

```js
const ADMIN_KEY = process.env.ADMIN_KEY;
if (req.headers['x-admin-key'] !== ADMIN_KEY) {
  return res.status(403).json({ success: false, message: 'Forbidden' });
}
```

#### Headers:

```
x-admin-key: your-admin-secret
```

#### Response:

```json
{
  "success": true,
  "message": "API key regenerated successfully",
  "data": {
    "device_id": 1,
    "api_key": "new_generated_api_key"
  }
}
```

---

### ❌ Errors & Status Codes

| Code | Description                                    |
| ---- | ---------------------------------------------- |
| 400  | Validation error                               |
| 401  | Missing/Invalid API key                        |
| 403  | Forbidden (e.g., unauthorized regenerate call) |
| 404  | Device not found                               |
| 409  | Duplicate `device_id`                          |
| 500  | Server error                                   |

