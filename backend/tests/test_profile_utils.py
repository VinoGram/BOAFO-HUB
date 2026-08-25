import unittest

from backend.routers.profile import build_profile_payload


class ProfilePayloadTests(unittest.TestCase):
    def test_build_profile_payload_includes_profile_fields(self):
        row = {
            "id": 7,
            "name": "Ada",
            "email": "ada@example.com",
            "phone": "+233241234567",
            "role": "customer",
            "profilePictureUrl": "https://cdn.example.com/avatar.jpg",
            "bio": "Trades enthusiast",
            "location": "Accra",
            "website": "https://ada.example",
            "company": "Ada Works",
        }

        payload = build_profile_payload(row)

        self.assertEqual(payload["name"], "Ada")
        self.assertEqual(payload["bio"], "Trades enthusiast")
        self.assertEqual(payload["location"], "Accra")
        self.assertEqual(payload["company"], "Ada Works")
        self.assertEqual(payload["profilePictureUrl"], "https://cdn.example.com/avatar.jpg")


if __name__ == "__main__":
    unittest.main()
