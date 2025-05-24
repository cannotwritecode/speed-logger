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




## 📘 Speed Events API Documentation

Base URL: `/api/speed-events`

---

### 📌 POST `/`

**Description:** Record a new speed event (typically from a Raspberry Pi device).

**Headers:**

* `Authorization`: Bearer token (device must be authenticated)

**Body:**

```json
{
  "vehicle_id": "ABC123",         // Optional
  "speed": 72.5,                  // Required
  "speed_limit": 60,              // Required
  "image_url": "http://example.com/image.jpg" // Optional
}
```

**Success Response:**

* `201 Created`

```json
{
  "success": true,
  "message": "Speed event recorded successfully",
  "data": {
    "id": 1,
    "device_id": "xyz123",
    "vehicle_id": "ABC123",
    "speed": 72.5,
    "speed_limit": 60,
    "image_url": "http://example.com/image.jpg",
    "timestamp": "2024-08-22T10:00:00Z",
    "processed": false
  }
}
```

---

### 📌 GET `/`

**Description:** Retrieve all speed events with optional filters and pagination.

**Query Parameters (optional):**

* `device_id`: Filter by device
* `min_speed`: Minimum speed (e.g. `50`)
* `date_from`: Start date (ISO format)
* `date_to`: End date (ISO format)
* `page`: Page number (default: `1`)
* `limit`: Results per page (default: `20`)

**Sample Request:**

```
GET /api/speed-events?device_id=xyz123&min_speed=70&page=1&limit=10
```

**Success Response:**

```json
{
  "success": true,
  "data": [ /* array of speed events */ ],
  "pagination": {
    "total": 42,
    "page": 1,
    "totalPages": 5,
    "limit": 10
  }
}
```

---

### 📌 GET `/:id`

**Description:** Retrieve a specific speed event by its ID.

**Example Request:**

```
GET /api/speed-events/7
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": 7,
    "device_id": "xyz123",
    "speed": 85.2,
    "speed_limit": 60,
    "image_url": "http://example.com/image.jpg",
    "timestamp": "2024-08-22T10:00:00Z",
    "processed": false
  }
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Speed event not found"
}
```

---

### 📌 PUT `/:id/process`

**Description:** Mark a speed event as processed.

**Example Request:**

```
PUT /api/speed-events/7/process
```

**Success Response:**

```json
{
  "success": true,
  "message": "Speed event marked as processed",
  "data": {
    "id": 7,
    "processed": true,
    ...
  }
}
```

---

### ⚠️ Error Response Format

In all endpoints, if a validation or server error occurs:

```json
{
  "success": false,
  "message": "Description of the error"
}
```


## 📘 **Settings API Documentation**

### Base URL

```
/api/settings
```

## 🔧 Global Settings

### 📥 `GET api/settings`

**Description:** Fetch all global settings.

**Response:**

```json
{
  "success": true,
  "data": [
    { "key": "exampleKey", "value": "exampleValue" },
    ...
  ]
}
```

---

### 📥 `GET api/settings/:key`

**Description:** Fetch a specific global setting by key.

**Params:**

* `key` – the key name of the setting.

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "key": "exampleKey",
    "value": "exampleValue"
  }
}
```

**Response (Not Found):**

```json
{
  "success": false,
  "message": "Setting not found"
}
```

---

### 📝 `POST api/settings`

**Description:** Create or update a global setting.

**Body:**

```json
{
  "key": "exampleKey",
  "value": "exampleValue"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Setting saved successfully",
  "data": {
    "key": "exampleKey",
    "value": "exampleValue"
  }
}
```

---

### ❌ `DELETE api/settings/:key`

**Description:** Delete a global setting by key.

**Params:**

* `key` – the key name of the setting.

**Response (Success):**

```json
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

**Response (Not Found):**

```json
{
  "success": false,
  "message": "Setting not found"
}
```

---

## 📱 Device-specific Settings

### 📥 `GET api/settings/device/:deviceId`

**Description:** Fetch all settings for a specific device, merging with global settings.

**Params:**

* `deviceId` – device identifier.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "key": "settingKey",
      "value": "settingValue",
      "is_custom": true
    },
    ...
  ]
}
```

---

### 📥 `GET api/settings/device/:deviceId/:key`

**Description:** Fetch a setting for a specific device by key (falls back to global if device-specific not found).

**Params:**

* `deviceId` – device identifier.
* `key` – setting key.

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "key": "exampleKey",
    "value": "exampleValue",
    "device_id": "device123"
  }
}
```

**Response (Not Found):**

```json
{
  "success": false,
  "message": "Setting not found"
}
```

---

### 📝 `POST api/settings/device/:deviceId`

**Description:** Create or update a setting for a specific device.

**Params:**

* `deviceId` – device identifier.

**Body:**

```json
{
  "key": "exampleKey",
  "value": "exampleValue"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Device setting saved successfully",
  "data": {
    "key": "exampleKey",
    "value": "exampleValue"
  }
}
```

---

### ❌ `DELETE api/settings/device/:deviceId/:key`

**Description:** Delete a setting for a specific device by key.

**Params:**

* `deviceId` – device identifier.
* `key` – setting key.

**Response (Success):**

```json
{
  "success": true,
  "message": "Device setting saved successfully",
  "data": {
    "key": "exampleKey",
    "value": "exampleValue"
  }
}
```

**Response (Not Found):**

```json
{
  "success": false,
  "message": "Setting not found"
}
```

---

## 🗃️ Setting Model Functions (Internal Use)

* **`Setting.get(key, deviceId?)`** – Gets a single setting, falling back to global if `deviceId` is provided.
* **`Setting.getAll(deviceId?)`** – Gets all settings. If `deviceId` is given, merges device-specific and global.
* **`Setting.set(key, value, deviceId?)`** – Inserts or updates a setting.
* **`Setting.delete(key, deviceId?)`** – Deletes a setting by key, optionally for a specific device.
