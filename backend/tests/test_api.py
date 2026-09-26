import io
import os
import unittest

import mongomock
from fastapi.testclient import TestClient

from app.main import app, database, storage


class ObjectStream(io.BytesIO):
    def release_conn(self):
        pass


class FakeMinio:
    def __init__(self):
        self.objects = {}

    def put_object(self, bucket, name, file, size, content_type):
        self.objects[name] = file.read(size)

    def get_object(self, bucket, name, offset=0, length=0):
        return ObjectStream(self.objects[name][offset:offset + length] if length else self.objects[name][offset:])

    def remove_object(self, bucket, name):
        del self.objects[name]


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.db = mongomock.MongoClient().reanty
        self.db.newsletter_subscriptions.create_index('email', unique=True)
        self.minio = FakeMinio()
        app.dependency_overrides[database] = lambda: self.db
        app.dependency_overrides[storage] = lambda: self.minio
        os.environ['ADMIN_TOKEN'] = 'test-token'
        self.client = TestClient(app)
        self.auth = {'Authorization': 'Bearer test-token'}

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        os.environ.pop('ADMIN_TOKEN', None)

    def test_content_auth_version_and_inbox(self):
        public = self.client.get('/api/site').json()
        self.assertEqual(public['content']['hero']['media_id'], '')
        self.assertEqual(self.client.get('/api/admin/site').status_code, 401)
        public['content']['contact']['phone'] = '+84 123 456 789'
        payload = {'content': public['content'], 'version': public['version']}
        result = self.client.put('/api/admin/site', json=payload, headers=self.auth)
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(self.client.get('/api/site').json()['content']['contact']['phone'], '+84 123 456 789')
        self.assertEqual(self.client.put('/api/admin/site', json=payload, headers=self.auth).status_code, 409)
        self.assertEqual(self.client.post('/api/contact', json={'name': 'Gino Leo', 'email': 'GINO@example.com', 'message': 'Need a house'}).status_code, 201)
        self.assertEqual(self.client.get('/api/admin/messages', headers=self.auth).json()[0]['email'], 'gino@example.com')
        for _ in range(2):
            self.assertEqual(self.client.post('/api/newsletter', json={'email': 'a@example.com'}).status_code, 201)
        self.assertEqual(len(self.client.get('/api/admin/subscribers', headers=self.auth).json()), 1)

    def test_media_upload_assign_stream_and_delete(self):
        png = b'\x89PNG\r\n\x1a\n' + b'example-image-bytes'
        uploaded = self.client.post('/api/admin/media', headers=self.auth, files={'file': ('home.png', png, 'image/png')})
        self.assertEqual(uploaded.status_code, 201, uploaded.text)
        media_id = uploaded.json()['id']
        self.assertEqual(self.client.get(f'/api/media/{media_id}/file').content, png)
        part = self.client.get(f'/api/media/{media_id}/file', headers={'Range': 'bytes=0-7'})
        self.assertEqual(part.status_code, 206)
        self.assertEqual(part.content, png[:8])
        site = self.client.get('/api/site').json()
        site['content']['hero']['media_id'] = media_id
        saved = self.client.put('/api/admin/site', headers=self.auth, json={'content': site['content'], 'version': site['version']})
        self.assertEqual(saved.status_code, 200, saved.text)
        self.assertEqual(self.client.get('/api/site').json()['media'][media_id]['mime_type'], 'image/png')
        self.assertEqual(self.client.delete(f'/api/admin/media/{media_id}', headers=self.auth).status_code, 409)
        site = self.client.get('/api/site').json()
        site['content']['hero']['media_id'] = ''
        self.client.put('/api/admin/site', headers=self.auth, json={'content': site['content'], 'version': site['version']})
        self.assertEqual(self.client.delete(f'/api/admin/media/{media_id}', headers=self.auth).status_code, 200)
        self.assertEqual(self.client.get(f'/api/media/{media_id}/file').status_code, 404)
        bad = self.client.post('/api/admin/media', headers=self.auth, files={'file': ('bad.svg', b'<svg></svg>', 'image/svg+xml')})
        self.assertEqual(bad.status_code, 415)


if __name__ == '__main__':
    unittest.main()
